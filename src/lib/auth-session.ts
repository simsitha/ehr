// Cryptographically signed session helper using standard Web Crypto API
// Compatible with Next.js App Router, Route Handlers, and Edge/Proxy middleware

const SECRET = process.env.AUTH_SECRET || 'hestrahrm_cambodia_hrms_secure_secret_token_2026';

export interface SessionData {
  userId: string;
  role: 'Admin' | 'Manager' | 'Employee';
  iat: number;
}

export async function createSessionToken(userId: string, role: string): Promise<string> {
  const data: SessionData = {
    userId,
    role: (role === 'Admin' || role === 'Manager' || role === 'Employee') ? role : 'Employee',
    iat: Date.now(),
  };
  const payloadStr = JSON.stringify(data);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const b64Payload = btoa(unescape(encodeURIComponent(payloadStr)));
  return `${b64Payload}.${sigHex}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionData | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [b64Payload, sigHex] = parts;
  try {
    const payloadStr = decodeURIComponent(escape(atob(b64Payload)));
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const match = sigHex.match(/.{1,2}/g);
    if (!match) return null;
    const sigBytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payloadStr));

    if (!isValid) return null;

    const session = JSON.parse(payloadStr) as SessionData;
    // Expire session after 7 days
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.iat > maxAgeMs) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
