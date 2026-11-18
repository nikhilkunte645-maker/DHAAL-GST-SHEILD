/**
 * Computes SHA-256 hash using Web Crypto API
 * Returns full hex string and short (first 8 chars) display hash
 */
export async function computeSha256(content: string): Promise<{ fullHash: string; shortHash: string }> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fullHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return {
        fullHash,
        shortHash: fullHash.substring(0, 8).toUpperCase(),
      };
    }
  } catch (err) {
    console.error('Web Crypto API error:', err);
  }

  // Pure JS fallback if crypto.subtle is unavailable (e.g. non-secure local environment)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const fallbackHex = Math.abs(hash).toString(16).padStart(8, '0');
  return {
    fullHash: fallbackHex.repeat(8),
    shortHash: fallbackHex.substring(0, 8).toUpperCase(),
  };
}
