import crypto from "crypto";

/*
|--------------------------------------------------------------------------
| CAPTCHA CHARACTER SET
|--------------------------------------------------------------------------
|
| Confusing characters are intentionally removed:
|
| 0 / O
| 1 / I / l
|
*/
const CAPTCHA_CHARS =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

const SECRET_KEY =
  process.env.CAPTCHA_SECRET ||
  "samarth_captcha_hmac_secret_2026_xyz";

const DEFAULT_LENGTH = 6;
const MIN_LENGTH = 4;
const MAX_LENGTH = 10;

const CAPTCHA_EXPIRY_MS = 5 * 60 * 1000;


/*
|--------------------------------------------------------------------------
| NORMALIZE CAPTCHA LENGTH
|--------------------------------------------------------------------------
*/

function normalizeCaptchaLength(length) {
  const parsedLength = Number(length);

  if (!Number.isFinite(parsedLength)) {
    return DEFAULT_LENGTH;
  }

  return Math.min(
    MAX_LENGTH,
    Math.max(
      MIN_LENGTH,
      Math.floor(parsedLength)
    )
  );
}


/*
|--------------------------------------------------------------------------
| GENERATE CAPTCHA TEXT
|--------------------------------------------------------------------------
*/

function generateCaptchaText(length) {
  let text = "";

  for (let i = 0; i < length; i++) {
    const index = crypto.randomInt(
      0,
      CAPTCHA_CHARS.length
    );

    text += CAPTCHA_CHARS[index];
  }

  return text;
}


/*
|--------------------------------------------------------------------------
| GENERATE CAPTCHA
|--------------------------------------------------------------------------
*/

export function generateCaptcha(
  length = DEFAULT_LENGTH
) {
  const captchaLength =
    normalizeCaptchaLength(length);

  const text =
    generateCaptchaText(captchaLength);

  const width =
    Math.max(
      220,
      45 * captchaLength
    );

  const height = 75;


/*
|--------------------------------------------------------------------------
| NOISE LINES
|--------------------------------------------------------------------------
*/

  let noiseLines = "";

  for (let i = 0; i < 6; i++) {
    const x1 =
      Math.floor(
        Math.random() * width
      );

    const y1 =
      Math.floor(
        Math.random() * height
      );

    const x2 =
      Math.floor(
        Math.random() * width
      );

    const y2 =
      Math.floor(
        Math.random() * height
      );

    const controlX =
      Math.floor(
        Math.random() * width
      );

    const controlY =
      Math.floor(
        Math.random() * height
      );

    const hue =
      Math.floor(
        Math.random() * 360
      );

    const color =
      `hsl(${hue}, 55%, 45%)`;

    const strokeWidth =
      (
        Math.random() * 1.5 +
        0.8
      ).toFixed(2);

    noiseLines += `
      <path
        d="M${x1} ${y1}
           Q${controlX} ${controlY}
           ${x2} ${y2}"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        fill="none"
        opacity="0.55"
      />
    `;
  }


/*
|--------------------------------------------------------------------------
| NOISE DOTS
|--------------------------------------------------------------------------
*/

  let noiseDots = "";

  for (let i = 0; i < 40; i++) {
    const cx =
      Math.floor(
        Math.random() * width
      );

    const cy =
      Math.floor(
        Math.random() * height
      );

    const radius =
      Math.random() * 1.8 +
      0.7;

    const hue =
      Math.floor(
        Math.random() * 360
      );

    const color =
      `hsl(${hue}, 65%, 50%)`;

    noiseDots += `
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius.toFixed(2)}"
        fill="${color}"
        opacity="0.45"
      />
    `;
  }


/*
|--------------------------------------------------------------------------
| CAPTCHA CHARACTERS
|--------------------------------------------------------------------------
*/

  let charElements = "";

  const spacing =
    (width - 50) /
    captchaLength;

  for (
    let i = 0;
    i < captchaLength;
    i++
  ) {
    const char = text[i];

    const baseX =
      25 + i * spacing;

    const xVariation =
      Math.random() * 8 - 4;

    const x =
      baseX + xVariation;

    const yVariation =
      Math.random() * 12 - 6;

    const y =
      48 + yVariation;

    const rotation =
      Math.floor(
        Math.random() * 45 - 22
      );

    const fontSize =
      Math.floor(
        Math.random() * 9 + 31
      );

    const hue =
      Math.floor(
        Math.random() * 360
      );

    const color =
      `hsl(${hue}, 75%, 28%)`;

    const fontWeight =
      Math.random() > 0.5
        ? "bold"
        : "600";

    const fontFamily =
      Math.random() > 0.5
        ? "Arial, sans-serif"
        : "Verdana, sans-serif";

    charElements += `
      <text
        x="${x.toFixed(2)}"
        y="${y.toFixed(2)}"
        fill="${color}"
        font-size="${fontSize}px"
        font-family="${fontFamily}"
        font-weight="${fontWeight}"
        transform="
          rotate(
            ${rotation},
            ${x.toFixed(2)},
            ${y.toFixed(2)}
          )
        "
      >${char}</text>
    `;
  }


/*
|--------------------------------------------------------------------------
| CAPTCHA SVG
|--------------------------------------------------------------------------
*/

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      style="
        background:
          linear-gradient(
            135deg,
            #f0fdf4 0%,
            #e0f2fe 100%
          );
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        user-select: none;
      "
    >
      ${noiseLines}

      ${noiseDots}

      ${charElements}
    </svg>
  `;


/*
|--------------------------------------------------------------------------
| CREATE SECURE CAPTCHA TOKEN
|--------------------------------------------------------------------------
|
| Token contains:
|
| timestamp
| HMAC
| actual CAPTCHA solution
|
| Original character case is preserved.
|
*/

  const timestamp =
    Date.now();

  const payload =
    `${text}:${timestamp}`;

  const hmac =
    crypto
      .createHmac(
        "sha256",
        SECRET_KEY
      )
      .update(payload)
      .digest("hex");

  const token =
    Buffer
      .from(
        `${timestamp}:${hmac}:${text}`
      )
      .toString("base64");


  return {
    svg,
    token,
    length: captchaLength
  };
}


/*
|--------------------------------------------------------------------------
| VERIFY CAPTCHA TOKEN ONLY
|--------------------------------------------------------------------------
|
| This function DOES NOT compare the user's answer.
|
| It only:
|
| 1. Decodes token
| 2. Checks timestamp
| 3. Checks expiry
| 4. Recreates HMAC
| 5. Verifies HMAC
| 6. Returns original CAPTCHA text
|
| captcha.js will compare the submitted answer separately.
|
*/

export function verifyCaptchaToken(token) {
  if (!token) {
    return {
      valid: false,
      reason: "Missing captcha token."
    };
  }

  try {
    const decoded =
      Buffer
        .from(
          token,
          "base64"
        )
        .toString("utf-8");

    const parts =
      decoded.split(":");

    /*
     * Expected:
     *
     * timestamp:hmac:solution
     */
    if (parts.length !== 3) {
      return {
        valid: false,
        reason: "Invalid captcha token."
      };
    }

    const [
      timestampStr,
      receivedHmac,
      actualSolution
    ] = parts;

    const timestamp =
      Number(timestampStr);

    if (
      !Number.isFinite(timestamp) ||
      timestamp <= 0 ||
      typeof actualSolution !== "string" ||
      actualSolution.length === 0
    ) {
      return {
        valid: false,
        reason: "Invalid captcha token."
      };
    }

    const now =
      Date.now();

    const age =
      now - timestamp;

    /*
     * CAPTCHA cannot come from the future.
     */
    if (age < 0) {
      return {
        valid: false,
        reason: "Invalid captcha timestamp."
      };
    }

    /*
     * CAPTCHA expires after 5 minutes.
     */
    if (
      age > CAPTCHA_EXPIRY_MS
    ) {
      return {
        valid: false,
        reason:
          "Captcha expired. Please refresh."
      };
    }

    /*
     * Recreate expected HMAC.
     */
    const expectedPayload =
      `${actualSolution}:${timestamp}`;

    const expectedHmac =
      crypto
        .createHmac(
          "sha256",
          SECRET_KEY
        )
        .update(expectedPayload)
        .digest("hex");

    const receivedBuffer =
      Buffer.from(
        receivedHmac,
        "utf8"
      );

    const expectedBuffer =
      Buffer.from(
        expectedHmac,
        "utf8"
      );

    /*
     * Length must match before
     * timingSafeEqual().
     */
    if (
      receivedBuffer.length !==
      expectedBuffer.length
    ) {
      return {
        valid: false,
        reason:
          "Invalid captcha signature."
      };
    }

    /*
     * Secure HMAC comparison.
     */
    if (
      !crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      )
    ) {
      return {
        valid: false,
        reason:
          "Invalid captcha signature."
      };
    }

    /*
     * Token is valid.
     *
     * Return original CAPTCHA text
     * so captcha.js can compare it
     * with the user's submitted answer.
     */
    return {
      valid: true,
      text: actualSolution,
      timestamp
    };

  } catch (error) {
    console.error(
      "Captcha token verification error:",
      error
    );

    return {
      valid: false,
      reason:
        "Failed to verify captcha token."
    };
  }
}


/*
|--------------------------------------------------------------------------
| VERIFY CAPTCHA SOLUTION
|--------------------------------------------------------------------------
|
| This function is kept for compatibility with
| any other code that may use it.
|
| It performs:
|
| 1. Token validation
| 2. Expiry validation
| 3. Minimum solve-time validation
| 4. Exact case-sensitive answer comparison
|
*/

export function verifyCaptchaSolution(
  userInput,
  token,
  minSeconds = 1.0
) {
  if (
    typeof userInput !== "string" ||
    !userInput.trim() ||
    !token
  ) {
    return {
      valid: false,
      reason:
        "Missing input or token"
    };
  }

  const verification =
    verifyCaptchaToken(token);

  if (
    !verification ||
    !verification.valid
  ) {
    return verification;
  }

  /*
   * Basic anti-bot timing check.
   */
  if (
    Number.isFinite(
      verification.timestamp
    )
  ) {
    const elapsed =
      Date.now() -
      verification.timestamp;

    if (
      elapsed <
      minSeconds * 1000
    ) {
      return {
        valid: false,
        reason:
          "Solved suspiciously fast. Bot detected."
      };
    }
  }

  /*
   * IMPORTANT:
   *
   * Case-sensitive comparison.
   *
   * DO NOT use:
   * toLowerCase()
   * toUpperCase()
   */
  const submittedAnswer =
    userInput.trim();

  if (
    submittedAnswer !==
    verification.text
  ) {
    return {
      valid: false,
      reason:
        "Incorrect captcha text. Try again."
    };
  }

  return {
    valid: true,
    text: verification.text,
    timestamp:
      verification.timestamp
  };
}