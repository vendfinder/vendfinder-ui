const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/**
 * Verify a Google ID token and return user info
 */
async function verifyGoogleToken(idToken) {
  if (!googleClient) {
    throw new Error('Google OAuth is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  return {
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    providerId: payload.sub,
    avatarUrl: payload.picture || null,
  };
}

/**
 * Verify an Apple ID token and return user info
 * Apple uses JWKS (JSON Web Key Sets) for token verification
 */
async function verifyAppleToken(idToken) {
  if (!APPLE_CLIENT_ID) {
    throw new Error('Apple OAuth is not configured');
  }

  const fetch = (await import('node-fetch')).default;

  // Decode the JWT header to get the key ID
  const [headerB64] = idToken.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());

  // Fetch Apple's public keys
  const jwksRes = await fetch('https://appleid.apple.com/auth/keys');
  const jwks = await jwksRes.json();

  // Find the matching key
  const key = jwks.keys.find(k => k.kid === header.kid);
  if (!key) {
    throw new Error('Apple public key not found');
  }

  // Convert JWK to PEM for verification
  const jwt = require('jsonwebtoken');
  const pem = jwkToPem(key);

  const payload = jwt.verify(idToken, pem, {
    algorithms: ['RS256'],
    issuer: 'https://appleid.apple.com',
    audience: APPLE_CLIENT_ID,
  });

  return {
    email: payload.email,
    name: null, // Apple only sends name on first auth; frontend passes it separately
    providerId: payload.sub,
    avatarUrl: null,
  };
}

/**
 * Convert a JWK RSA key to PEM format
 */
function jwkToPem(jwk) {
  const { n, e } = jwk;
  const nBuf = Buffer.from(n, 'base64url');
  const eBuf = Buffer.from(e, 'base64url');

  // DER encode the RSA public key
  const nLen = nBuf.length;
  const eLen = eBuf.length;

  // Integer encoding helper
  function encodeInteger(buf) {
    // Add leading zero if high bit is set
    if (buf[0] & 0x80) {
      return Buffer.concat([Buffer.from([0x02, buf.length + 1, 0x00]), buf]);
    }
    return Buffer.concat([Buffer.from([0x02, buf.length]), buf]);
  }

  function encodeLength(len) {
    if (len < 128) return Buffer.from([len]);
    if (len < 256) return Buffer.from([0x81, len]);
    return Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
  }

  const nEncoded = encodeInteger(nBuf);
  const eEncoded = encodeInteger(eBuf);

  const sequenceContent = Buffer.concat([nEncoded, eEncoded]);
  const sequenceLen = encodeLength(sequenceContent.length);
  const sequence = Buffer.concat([Buffer.from([0x30]), sequenceLen, sequenceContent]);

  // Wrap in BIT STRING
  const bitString = Buffer.concat([Buffer.from([0x03]), encodeLength(sequence.length + 1), Buffer.from([0x00]), sequence]);

  // RSA OID: 1.2.840.113549.1.1.1
  const oid = Buffer.from([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]);

  const outerContent = Buffer.concat([oid, bitString]);
  const outerLen = encodeLength(outerContent.length);
  const der = Buffer.concat([Buffer.from([0x30]), outerLen, outerContent]);

  const b64 = der.toString('base64');
  const lines = b64.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

module.exports = { verifyGoogleToken, verifyAppleToken };
