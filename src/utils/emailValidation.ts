// List of common public/personal email domains that are NOT work emails
const PUBLIC_EMAIL_DOMAINS = [
  // Major providers
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.es',
  'yahoo.it',
  'yahoo.co.jp',
  'ymail.com',
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'hotmail.de',
  'hotmail.es',
  'hotmail.it',
  'outlook.com',
  'outlook.co.uk',
  'outlook.fr',
  'outlook.de',
  'live.com',
  'live.co.uk',
  'live.fr',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'aol.co.uk',
  
  // Privacy-focused
  'protonmail.com',
  'protonmail.ch',
  'proton.me',
  'tutanota.com',
  'tutanota.de',
  'tutamail.com',
  'pm.me',
  
  // Other popular providers
  'mail.com',
  'email.com',
  'zoho.com',
  'zohomail.com',
  'yandex.com',
  'yandex.ru',
  'mail.ru',
  'inbox.com',
  'gmx.com',
  'gmx.de',
  'gmx.net',
  'web.de',
  'freenet.de',
  't-online.de',
  'bluewin.ch',
  'orange.fr',
  'wanadoo.fr',
  'laposte.net',
  'libero.it',
  'virgilio.it',
  'seznam.cz',
  'wp.pl',
  'o2.pl',
  'interia.pl',
  'rambler.ru',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'naver.com',
  'daum.net',
  'hanmail.net',
  
  // Temporary/disposable email domains (common ones)
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'throwaway.email',
  'temp-mail.org',
  'fakeinbox.com',
  'dispostable.com'
];

/**
 * Check if an email address is from a public/personal email provider
 * @param email - The email address to check
 * @returns true if the email is a work email (not from a public provider)
 */
export function isWorkEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  
  return !PUBLIC_EMAIL_DOMAINS.includes(domain);
}

/**
 * Check if an email is from a public/personal provider
 * @param email - The email address to check
 * @returns true if the email is from a public provider (Gmail, Yahoo, etc.)
 */
export function isPublicEmail(email: string): boolean {
  return !isWorkEmail(email);
}

/**
 * Extract the company domain from a work email address
 * @param email - The email address
 * @returns The domain if it's a work email, null otherwise
 */
export function extractCompanyDomain(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return null;
  
  // Return null for public email domains
  if (PUBLIC_EMAIL_DOMAINS.includes(domain)) return null;
  
  return domain;
}

/**
 * Get a user-friendly error message for non-work email
 * @returns Error message string
 */
export function getWorkEmailErrorMessage(): string {
  return 'Please use your company email address. Personal email providers (Gmail, Yahoo, Outlook, etc.) are not allowed for employer accounts.';
}

/**
 * Validate email format
 * @param email - The email to validate
 * @returns true if the email format is valid
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}
