import crypto from 'crypto';

const CAPTCHA_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const SECRET_KEY = process.env.CAPTCHA_SECRET || 'samarth_captcha_hmac_secret_2026_xyz';

export function generateCaptcha(length = 6) {
  let text = '';
  for (let i = 0; i < length; i++) {
    text += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
  }

  const width = 220;
  const height = 75;

  // Background gradient and noise lines
  let noiseLines = '';
  for (let i = 0; i < 5; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const color = `hsl(${Math.floor(Math.random() * 360)}, 60%, 45%)`;
    noiseLines += `<path d="M${x1} ${y1} Q ${Math.floor(Math.random() * width)} ${Math.floor(Math.random() * height)} ${x2} ${y2}" stroke="${color}" stroke-width="${Math.random() * 2 + 1}" fill="none" opacity="0.6"/>`;
  }

  // Dots
  let noiseDots = '';
  for (let i = 0; i < 35; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = Math.random() * 2 + 1;
    const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
    noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="0.5"/>`;
  }

  // Characters
  let charElements = '';
  const spacing = (width - 40) / length;
  for (let i = 0; i < length; i++) {
    const char = text[i];
    const x = 25 + i * spacing + (Math.random() * 6 - 3);
    const y = 48 + (Math.random() * 10 - 5);
    const rot = Math.floor(Math.random() * 40 - 20);
    const color = `hsl(${Math.floor(Math.random() * 360)}, 80%, 30%)`;
    const fontSize = Math.floor(Math.random() * 6 + 32);
    charElements += `<text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold" transform="rotate(${rot}, ${x}, ${y})">${char}</text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%); border-radius: 8px; border: 1px solid #cbd5e1; user-select: none;">
    ${noiseLines}
    ${noiseDots}
    ${charElements}
  </svg>`;

  const timestamp = Date.now();
  // Create HMAC token containing timestamp and solution
  const payload = `${text.toLowerCase()}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  const token = Buffer.from(`${timestamp}:${hmac}:${text.toLowerCase()}`).toString('base64');

  return {
    svg,
    token
  };
}

export function verifyCaptchaSolution(userInput, token, minSeconds = 1.0) {
  if (!userInput || !token) return { valid: false, reason: 'Missing input or token' };

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestampStr, receivedHmac, actualSolution] = decoded.split(':');
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();

    // Check expiry (valid for 5 minutes)
    if (now - timestamp > 5 * 60 * 1000) {
      return { valid: false, reason: 'Captcha expired. Please refresh.' };
    }

    // Anti-bot check: human typing takes at least ~1.0 second
    if ((now - timestamp) < (minSeconds * 1000)) {
      return { valid: false, reason: 'Solved suspiciously fast. Bot detected.' };
    }

    // Verify HMAC
    const expectedPayload = `${actualSolution}:${timestamp}`;
    const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(expectedPayload).digest('hex');

    if (receivedHmac !== expectedHmac) {
      return { valid: false, reason: 'Invalid captcha signature.' };
    }

    // Compare characters (case-insensitive)
    if (userInput.trim().toLowerCase() !== actualSolution.toLowerCase()) {
      return { valid: false, reason: 'Incorrect captcha text. Try again.' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, reason: 'Failed to verify captcha.' };
  }
}
