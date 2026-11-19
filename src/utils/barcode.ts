/**
 * MINT FASHION POS — Barcode Utility & Generator
 * Supports Code 128 and EAN-13 (with standard Modulo-10 Check Digit)
 */

export type BarcodeFormat = 'CODE128' | 'EAN13';

/**
 * Calculates standard EAN-13 modulo-10 check digit for the first 12 digits.
 * Formula:
 *  - Sum odd positions (1st, 3rd, 5th, 7th, 9th, 11th; 0-indexed: 0, 2, 4, 6, 8, 10) * 1
 *  - Sum even positions (2nd, 4th, 6th, 8th, 10th, 12th; 0-indexed: 1, 3, 5, 7, 9, 11) * 3
 *  - Check digit = (10 - ((sumOdd + sumEven) % 10)) % 10
 */
export function calculateEan13CheckDigit(twelveDigits: string): number {
  if (!/^\d{12}$/.test(twelveDigits)) {
    throw new Error('EAN-13 check digit calculation requires exactly 12 numeric digits');
  }

  let sumOdd = 0;
  let sumEven = 0;

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(twelveDigits[i], 10);
    if (i % 2 === 0) {
      sumOdd += digit;
    } else {
      sumEven += digit * 3;
    }
  }

  const total = sumOdd + sumEven;
  const remainder = total % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Validates whether an EAN-13 barcode is valid (13 numeric digits with correct check digit).
 */
export function validateEan13(code: string): { valid: boolean; reason?: string } {
  if (!code) return { valid: false, reason: 'Barcode cannot be empty' };
  if (!/^\d{13}$/.test(code)) {
    return { valid: false, reason: 'EAN-13 must be exactly 13 numeric digits' };
  }

  const twelveDigits = code.substring(0, 12);
  const expectedCheckDigit = calculateEan13CheckDigit(twelveDigits);
  const actualCheckDigit = parseInt(code[12], 10);

  if (expectedCheckDigit !== actualCheckDigit) {
    return {
      valid: false,
      reason: `Invalid check digit: expected ${expectedCheckDigit}, but found ${actualCheckDigit}`,
    };
  }

  return { valid: true };
}

/**
 * Generates a valid 13-digit EAN-13 barcode.
 * Uses 200 prefix (GS1 standard for restricted in-store retail circulation) + 9 unique random digits + check digit.
 */
export function generateEan13(prefix = '200'): string {
  const safePrefix = prefix.replace(/\D/g, '').padEnd(3, '0').substring(0, 3);
  const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
  const twelveDigits = `${safePrefix}${randomPart}`.substring(0, 12);
  const checkDigit = calculateEan13CheckDigit(twelveDigits);
  return `${twelveDigits}${checkDigit}`;
}

/**
 * Validates Code 128 barcode format.
 * Code 128 accepts standard printable ASCII characters (32 to 126).
 */
export function validateCode128(code: string): { valid: boolean; reason?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, reason: 'Barcode cannot be empty' };
  }
  if (code.length < 3 || code.length > 30) {
    return { valid: false, reason: 'Code 128 length must be between 3 and 30 characters' };
  }
  // Printable ASCII 32 to 126
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    if (charCode < 32 || charCode > 126) {
      return { valid: false, reason: `Invalid character '${code[i]}' for Code 128` };
    }
  }
  return { valid: true };
}

/**
 * Generates a unique Code 128 barcode for MINT FASHION.
 * Format: MF + 8 random/timestamp numeric digits, e.g. "MF84920193".
 * Scannable by any standard 1D laser or 2D image barcode scanner.
 */
export function generateCode128(prefix = 'MF'): string {
  const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'MF';
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `${cleanPrefix}${num}`;
}

/**
 * Auto-detects format: if 13 digits, treats as EAN-13; otherwise Code 128.
 */
export function detectBarcodeFormat(code: string): BarcodeFormat {
  if (/^\d{13}$/.test(code)) {
    const val = validateEan13(code);
    if (val.valid) return 'EAN13';
  }
  return 'CODE128';
}
