/**
 * Formats a phone number string to XXX-XXX-XXXX format
 * Automatically adds dashes as the user types
 * @param value - The raw phone number input
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');

  // Limit to 10 digits
  const limited = cleaned.substring(0, 10);

  // Format based on length
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
}

/**
 * Removes formatting from a phone number to get just the digits
 * @param value - The formatted phone number
 * @returns Clean phone number with only digits
 */
export function cleanPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}
