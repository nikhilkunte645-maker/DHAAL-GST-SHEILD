export type UrgencyLevel = 'normal' | 'caution' | 'critical';

export interface UrgencyInfo {
  level: UrgencyLevel;
  label: string;
  badgeClass: string;
  barColor: string;
  textColor: string;
  description: string;
}

/**
 * Computes urgency state from days left (30-15 = normal, 14-7 = caution, <7 = critical)
 * Note: These are UI/interface states, not statutory legal classifications.
 */
export function getUrgencyInfo(daysLeft: number): UrgencyInfo {
  if (daysLeft < 7) {
    return {
      level: 'critical',
      label: 'Critical Phase',
      badgeClass: 'bg-error text-on-error',
      barColor: '#C0392B',
      textColor: 'text-error',
      description: 'Less than 7 days remaining. Immediate CA intervention recommended.',
    };
  }

  if (daysLeft <= 14) {
    return {
      level: 'caution',
      label: 'Caution Phase',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-container',
      barColor: '#F59E0B',
      textColor: 'text-on-tertiary-container',
      description: '14 to 7 days remaining. Active preparation window.',
    };
  }

  return {
    level: 'normal',
    label: 'Normal Window',
    badgeClass: 'bg-secondary-fixed text-on-secondary-fixed',
    barColor: '#3b5baa',
    textColor: 'text-secondary',
    description: '30 to 15 days remaining. Standard response cycle.',
  };
}

/**
 * Computes circle stroke dash offset for the 30-day countdown ring
 * Radius 68 -> circumference = 2 * PI * 68 ≈ 427.256
 */
export function getRingDashOffset(daysLeft: number, totalDays = 30, circumference = 427.26): number {
  const clamped = Math.max(0, Math.min(daysLeft, totalDays));
  const progressRatio = clamped / totalDays;
  return circumference * (1 - progressRatio);
}
