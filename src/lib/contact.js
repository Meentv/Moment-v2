export const CONTACT_EMAIL = 'alameenahmed588@gmail.com';

export function contactMailto(subject = '', body = '') {
  const query = [
    subject.trim() && `subject=${encodeURIComponent(subject.trim())}`,
    body.trim() && `body=${encodeURIComponent(body.trim())}`,
  ].filter(Boolean).join('&');
  return `mailto:${CONTACT_EMAIL}${query ? `?${query}` : ''}`;
}
