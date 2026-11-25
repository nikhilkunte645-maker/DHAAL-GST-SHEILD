import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  fileName?: string;
  caseId?: string;
  marginMm?: number;
  scale?: number;
}

/**
 * High-precision A4 multi-page PDF exporter for Dhaal Compliance Dossiers.
 * - Enforces standard A4 geometry: 210mm x 297mm with consistent 12mm margins.
 * - Prevents right-edge and bottom clipping across all viewports.
 * - Renders off-screen at desktop A4 dimensions (794px) to ensure identical crisp output on mobile.
 * - Detects semantic section boundaries to avoid awkward page breaks across cards and tables.
 * - Waits for web fonts to load, ensuring Hindi and Marathi Devanagari text renders flawlessly.
 */
export async function exportDossierToPdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    fileName = 'DHAAL_CA_Brief.pdf',
    caseId = 'ZA270525008912M',
    marginMm = 12,
    scale = 2,
  } = options;

  // 1. Wait for all fonts (including Noto Sans Devanagari) to finish loading
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue if browser does not support fonts.ready
    }
  }

  // 2. Clone the element to render at standard A4 desktop width (794px)
  // This guarantees that mobile (390px) and tablet viewports produce the exact same
  // clean, un-cramped desktop A4 layout with zero responsive column collapsing.
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'printable-dossier-a4-export';
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.minWidth = '794px';
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.zIndex = '-9999';
  clone.style.backgroundColor = '#FFFFFF';
  clone.style.boxShadow = 'none';
  clone.style.transform = 'none';

  document.body.appendChild(clone);

  try {
    // 3. Render clone to high-resolution canvas with 2x retina scale
    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: 1200,
    });

    // 4. Standard A4 Dimensions in millimeters
    const a4WidthMm = 210;
    const a4HeightMm = 297;
    const margin = marginMm;
    const usableWidthMm = a4WidthMm - margin * 2; // 186mm
    const usableHeightMm = a4HeightMm - margin * 2; // 273mm

    // Canvas pixels per millimeter
    const pxPerMm = canvas.width / usableWidthMm;
    const maxPageHeightPx = Math.floor(usableHeightMm * pxPerMm);

    // 5. Detect semantic section boundaries from child cards
    const sectionBreaksPx: number[] = [];
    const container = clone.querySelector('.flex.flex-col.gap-6') || clone;
    const containerTop = container.getBoundingClientRect().top;

    for (const child of Array.from(container.children)) {
      const rect = child.getBoundingClientRect();
      const bottomRel = rect.bottom - containerTop;
      sectionBreaksPx.push(Math.round(bottomRel * scale));
    }

    // 6. Calculate page slices
    const slices: { startY: number; heightPx: number }[] = [];
    let currentY = 0;
    const totalHeightPx = canvas.height;

    while (currentY < totalHeightPx) {
      const remainingPx = totalHeightPx - currentY;
      if (remainingPx <= maxPageHeightPx) {
        slices.push({ startY: currentY, heightPx: remainingPx });
        break;
      }

      // Look for a clean semantic break before exceeding page height
      const maxNextY = currentY + maxPageHeightPx;
      let bestBreak = maxNextY;
      let foundSmartBreak = false;

      for (let i = sectionBreaksPx.length - 1; i >= 0; i--) {
        const b = sectionBreaksPx[i];
        if (b > currentY + maxPageHeightPx * 0.65 && b <= maxNextY) {
          bestBreak = b;
          foundSmartBreak = true;
          break;
        }
      }

      const sliceH = foundSmartBreak ? bestBreak - currentY : maxPageHeightPx;
      slices.push({ startY: currentY, heightPx: sliceH });
      currentY += sliceH;
    }

    // 7. Initialize jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const totalPages = slices.length;

    // 8. Composite each page slice
    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      if (pageIdx > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const { startY, heightPx } = slices[pageIdx];

      // Create temporary canvas slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = heightPx;

      const pageCtx = pageCanvas.getContext('2d');
      if (pageCtx) {
        pageCtx.fillStyle = '#FFFFFF';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          startY,
          canvas.width,
          heightPx,
          0,
          0,
          pageCanvas.width,
          heightPx
        );

        const pageImgData = pageCanvas.toDataURL('image/png');
        const sliceHeightMm = (heightPx * usableWidthMm) / canvas.width;

        pdf.addImage(
          pageImgData,
          'PNG',
          margin,
          margin,
          usableWidthMm,
          sliceHeightMm,
          undefined,
          'FAST'
        );
      }

      // Add formal dossier running footer
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(91, 107, 130); // #5B6B82
      const footerText = `Page ${pageIdx + 1} of ${totalPages} • Case Reference: #${caseId} • Assistive Drafting Aid for Professional CA Review (Form GST ASMT-10)`;
      pdf.text(footerText, a4WidthMm / 2, a4HeightMm - 5, { align: 'center' });
    }

    // 9. Save file
    pdf.save(fileName);
  } finally {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
}
