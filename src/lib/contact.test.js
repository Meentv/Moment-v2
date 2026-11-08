import { describe, expect, it } from 'vitest';
import { CONTACT_EMAIL, contactMailto } from './contact.js';

describe('contact email links', () => {
  it('uses the project owner’s requested email address', () => {
    expect(CONTACT_EMAIL).toBe('alameenahmed588@gmail.com');
    expect(contactMailto()).toBe('mailto:alameenahmed588@gmail.com');
    expect(contactMailto('   ', '\n')).toBe('mailto:alameenahmed588@gmail.com');
  });
  it('encodes a draft without sending anything automatically', () => {
    const link = contactMailto(' A question & idea ', 'Keep it simple.\nThank you!');
    expect(link).toBe(`mailto:${CONTACT_EMAIL}?subject=A%20question%20%26%20idea&body=Keep%20it%20simple.%0AThank%20you!`);
  });
});
