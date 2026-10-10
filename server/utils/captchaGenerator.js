import crypto from "crypto";

// =====================================================
// CAPTCHA GENERATOR
// =====================================================
//
// Supports:
// - text CAPTCHA
// - mixed CAPTCHA
// - image CAPTCHA
// - configurable character sets
// - configurable expiry
// - configurable image settings
// - encrypted + authenticated CAPTCHA token
//
// Backward compatibility:
// generateCaptcha(6) still works.
//
// IMPORTANT:
// The CAPTCHA answer is stored only inside the encrypted
// token. It is never returned separately in the API.
// =====================================================

// -----------------------------------------------------
// DEFAULTS
// -----------------------------------------------------

const DEFAULT_SETTINGS = {
  enabled: true,

  captchaType: "mixed",

  length: 6,

  includeLowercase: true,
  includeUppercase: true,
  includeNumbers: true,
  includeSymbols: false,

  symbols: "@#$%^&*",

  caseSensitive: true,

  expirySeconds: 10,

  image: {
    width: 320,
    height: 100,
    fontSize: 34,
    noiseLevel: 2,
    lineCount: 2,
    distortionLevel: 2,
    letterSpacing: 8,
    backgroundStyle: "light",
  },
};

// -----------------------------------------------------
// CHARACTER SETS
// -----------------------------------------------------
//
// Confusing characters are removed where practical:
//
// 0 / O
// 1 / I / l
// -----------------------------------------------------

const LOWERCASE_CHARS =
  "abcdefghijkmnpqrstuvwxyz";

const UPPERCASE_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ";

const NUMBER_CHARS =
  "23456789";

// -----------------------------------------------------
// CAPTCHA SECRET
// -----------------------------------------------------

const SECRET_KEY =
  process.env.CAPTCHA_SECRET ||
  process.env.JWT_SECRET ||
  "samarth_captcha_hmac_secret_2026_xyz";

// -----------------------------------------------------
// TOKEN ENCRYPTION KEY
// -----------------------------------------------------
//
// AES-256-GCM requires a 32-byte key.
// Derive one deterministically from the secret.
// -----------------------------------------------------

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(String(SECRET_KEY))
  .digest();

// -----------------------------------------------------
// LENGTH LIMITS
// -----------------------------------------------------

const MIN_LENGTH = 4;
const MAX_LENGTH = 32;

// -----------------------------------------------------
// SAFE NUMBER
// -----------------------------------------------------

function toNumber(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

// -----------------------------------------------------
// CLAMP NUMBER
// -----------------------------------------------------

function clampNumber(
  value,
  min,
  max,
  fallback
) {
  const number = toNumber(
    value,
    fallback
  );

  return Math.min(
    max,
    Math.max(
      min,
      number
    )
  );
}

// -----------------------------------------------------
// NORMALIZE BOOLEAN
// -----------------------------------------------------

function normalizeBoolean(
  value,
  fallback
) {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

// -----------------------------------------------------
// NORMALIZE CAPTCHA TYPE
// -----------------------------------------------------

function normalizeCaptchaType(type) {
  const normalized =
    String(type || "")
      .trim()
      .toLowerCase();

  if (
    normalized === "text" ||
    normalized === "mixed" ||
    normalized === "image"
  ) {
    return normalized;
  }

  return DEFAULT_SETTINGS.captchaType;
}

// -----------------------------------------------------
// NORMALIZE BACKGROUND STYLE
// -----------------------------------------------------

function normalizeBackgroundStyle(
  style
) {
  const normalized =
    String(style || "")
      .trim()
      .toLowerCase();

  const allowed = [
    "light",
    "white",
    "gray",
    "gradient",
    "random",
  ];

  return allowed.includes(
    normalized
  )
    ? normalized
    : DEFAULT_SETTINGS.image.backgroundStyle;
}

// -----------------------------------------------------
// NORMALIZE CAPTCHA LENGTH
// -----------------------------------------------------

function normalizeCaptchaLength(length) {
  return Math.floor(
    clampNumber(
      length,
      MIN_LENGTH,
      MAX_LENGTH,
      DEFAULT_SETTINGS.length
    )
  );
}

// -----------------------------------------------------
// NORMALIZE SETTINGS
// -----------------------------------------------------

export function normalizeCaptchaSettings(
  incoming = {}
) {
  const source =
    incoming && typeof incoming === "object"
      ? incoming
      : {};

  const incomingImage =
    source.image &&
    typeof source.image === "object"
      ? source.image
      : {};

  const normalized = {
    enabled:
      normalizeBoolean(
        source.enabled,
        DEFAULT_SETTINGS.enabled
      ),

    captchaType:
      normalizeCaptchaType(
        source.captchaType
      ),

    length:
      normalizeCaptchaLength(
        source.length
      ),

    includeLowercase:
      normalizeBoolean(
        source.includeLowercase,
        DEFAULT_SETTINGS.includeLowercase
      ),

    includeUppercase:
      normalizeBoolean(
        source.includeUppercase,
        DEFAULT_SETTINGS.includeUppercase
      ),

    includeNumbers:
      normalizeBoolean(
        source.includeNumbers,
        DEFAULT_SETTINGS.includeNumbers
      ),

    includeSymbols:
      normalizeBoolean(
        source.includeSymbols,
        DEFAULT_SETTINGS.includeSymbols
      ),

    symbols:
      typeof source.symbols === "string" &&
      source.symbols.trim().length > 0
        ? source.symbols.trim()
        : DEFAULT_SETTINGS.symbols,

    caseSensitive:
      normalizeBoolean(
        source.caseSensitive,
        DEFAULT_SETTINGS.caseSensitive
      ),

    expirySeconds:
      Math.floor(
        clampNumber(
          source.expirySeconds,
          1,
          3600,
          DEFAULT_SETTINGS.expirySeconds
        )
      ),

    image: {
      width:
        Math.floor(
          clampNumber(
            incomingImage.width,
            120,
            800,
            DEFAULT_SETTINGS.image.width
          )
        ),

      height:
        Math.floor(
          clampNumber(
            incomingImage.height,
            50,
            300,
            DEFAULT_SETTINGS.image.height
          )
        ),

      fontSize:
        Math.floor(
          clampNumber(
            incomingImage.fontSize,
            12,
            100,
            DEFAULT_SETTINGS.image.fontSize
          )
        ),

      noiseLevel:
        Math.floor(
          clampNumber(
            incomingImage.noiseLevel,
            0,
            20,
            DEFAULT_SETTINGS.image.noiseLevel
          )
        ),

      lineCount:
        Math.floor(
          clampNumber(
            incomingImage.lineCount,
            0,
            20,
            DEFAULT_SETTINGS.image.lineCount
          )
        ),

      distortionLevel:
        Math.floor(
          clampNumber(
            incomingImage.distortionLevel,
            0,
            10,
            DEFAULT_SETTINGS.image.distortionLevel
          )
        ),

      letterSpacing:
        Math.floor(
          clampNumber(
            incomingImage.letterSpacing,
            0,
            30,
            DEFAULT_SETTINGS.image.letterSpacing
          )
        ),

      backgroundStyle:
        normalizeBackgroundStyle(
          incomingImage.backgroundStyle
        ),
    },
  };

  return normalized;
}

// -----------------------------------------------------
// BUILD CHARACTER POOL
// -----------------------------------------------------

function buildCharacterPool(
  settings
) {
  let pool = "";

  if (
    settings.includeLowercase
  ) {
    pool += LOWERCASE_CHARS;
  }

  if (
    settings.includeUppercase
  ) {
    pool += UPPERCASE_CHARS;
  }

  if (
    settings.includeNumbers
  ) {
    pool += NUMBER_CHARS;
  }

  if (
    settings.includeSymbols
  ) {
    pool += settings.symbols;
  }

  // ---------------------------------------------------
  // Safety fallback
  // ---------------------------------------------------

  if (!pool.length) {
    pool =
      LOWERCASE_CHARS +
      UPPERCASE_CHARS +
      NUMBER_CHARS;
  }

  // ---------------------------------------------------
  // Remove duplicate characters
  // ---------------------------------------------------

  return [
    ...new Set(
      pool.split("")
    ),
  ].join("");
}

// -----------------------------------------------------
// GENERATE RANDOM CHARACTER
// -----------------------------------------------------

function randomCharacter(
  pool
) {
  if (!pool.length) {
    return "A";
  }

  const index =
    crypto.randomInt(
      0,
      pool.length
    );

  return pool[index];
}

// -----------------------------------------------------
// GENERATE CAPTCHA TEXT
// -----------------------------------------------------

function generateCaptchaText(
  length,
  settings
) {
  const pool =
    buildCharacterPool(
      settings
    );

  let text = "";

  for (
    let i = 0;
    i < length;
    i += 1
  ) {
    text +=
      randomCharacter(pool);
  }

  return text;
}

// -----------------------------------------------------
// ENCRYPT CAPTCHA PAYLOAD
// -----------------------------------------------------
//
// Format:
//
// base64url(
//   12-byte IV +
//   16-byte auth tag +
//   ciphertext
// )
//
// AES-256-GCM gives confidentiality + integrity.
// -----------------------------------------------------

function encryptCaptchaPayload(
  payload
) {
  const iv =
    crypto.randomBytes(12);

  const cipher =
    crypto.createCipheriv(
      "aes-256-gcm",
      ENCRYPTION_KEY,
      iv
    );

  const plaintext =
    Buffer.from(
      JSON.stringify(payload),
      "utf8"
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        plaintext
      ),
      cipher.final(),
    ]);

  const authTag =
    cipher.getAuthTag();

  return Buffer.concat([
    iv,
    authTag,
    encrypted,
  ]).toString("base64url");
}

// -----------------------------------------------------
// DECRYPT CAPTCHA PAYLOAD
// -----------------------------------------------------

function decryptCaptchaPayload(
  token
) {
  const packed =
    Buffer.from(
      String(token),
      "base64url"
    );

  if (
    packed.length <=
    12 + 16
  ) {
    return null;
  }

  const iv =
    packed.subarray(
      0,
      12
    );

  const authTag =
    packed.subarray(
      12,
      28
    );

  const encrypted =
    packed.subarray(28);

  const decipher =
    crypto.createDecipheriv(
      "aes-256-gcm",
      ENCRYPTION_KEY,
      iv
    );

  decipher.setAuthTag(
    authTag
  );

  const decrypted =
    Buffer.concat([
      decipher.update(
        encrypted
      ),
      decipher.final(),
    ]);

  return JSON.parse(
    decrypted.toString(
      "utf8"
    )
  );
}

// -----------------------------------------------------
// RANDOM HSL COLOR
// -----------------------------------------------------

function randomHsl(
  saturation = 65,
  lightness = 35
) {
  const hue =
    crypto.randomInt(
      0,
      360
    );

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// -----------------------------------------------------
// ESCAPE SVG TEXT
// -----------------------------------------------------

function escapeXml(
  value
) {
  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&apos;"
    );
}

// -----------------------------------------------------
// BACKGROUND COLORS
// -----------------------------------------------------
//
// SVG <rect> is used instead of relying on CSS gradient
// background support.
// -----------------------------------------------------

function getBackgroundDefinition(
  style
) {
  switch (style) {
    case "white":
      return {
        rect: `
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="#ffffff"
          />
        `,
        color: "#ffffff",
      };

    case "gray":
      return {
        rect: `
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="#e5e7eb"
          />
        `,
        color: "#e5e7eb",
      };

    case "gradient":
      return {
        defs: `
          <linearGradient
            id="captchaGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stop-color="#f0fdf4"
            />
            <stop
              offset="100%"
              stop-color="#e0f2fe"
            />
          </linearGradient>
        `,
        rect: `
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#captchaGradient)"
          />
        `,
        color: null,
      };

    case "random": {
      const hue1 =
        crypto.randomInt(
          0,
          360
        );

      const hue2 =
        crypto.randomInt(
          0,
          360
        );

      return {
        defs: `
          <linearGradient
            id="captchaRandomGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stop-color="hsl(${hue1}, 70%, 95%)"
            />
            <stop
              offset="100%"
              stop-color="hsl(${hue2}, 70%, 92%)"
            />
          </linearGradient>
        `,
        rect: `
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#captchaRandomGradient)"
          />
        `,
        color: null,
      };
    }

    case "light":
    default:
      return {
        rect: `
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="#f8fafc"
          />
        `,
        color: "#f8fafc",
      };
  }
}

// -----------------------------------------------------
// SVG WRAPPER
// -----------------------------------------------------

function wrapSvg({
  width,
  height,
  defs = "",
  content = "",
}) {
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      role="img"
      aria-label="CAPTCHA verification image"
      style="
        display:block;
        border-radius:8px;
        border:1px solid #cbd5e1;
        user-select:none;
        overflow:hidden;
      "
    >
      ${defs}
      ${content}
    </svg>
  `.trim();
}

// -----------------------------------------------------
// TEXT CAPTCHA RENDERER
// -----------------------------------------------------
//
// "text" mode intentionally stays clean:
//
// - no noise lines
// - no noise dots
// - no rotation
// - no strong distortion
// - readable text appearance
//
// It still returns SVG so the customer frontend can use
// the same <img>/<HTML rendering flow for all modes.
// -----------------------------------------------------

function generateTextCaptchaSvg(
  text,
  settings
) {
  const image =
    settings.image;

  const width =
    image.width;

  const height =
    image.height;

  const background =
    getBackgroundDefinition(
      image.backgroundStyle
    );

  const fontSize =
    Math.min(
      image.fontSize,
      Math.max(
        18,
        Math.floor(
          height * 0.55
        )
      )
    );

  const usableWidth =
    Math.max(
      40,
      width - 30
    );

  const spacing =
    Math.min(
      Math.max(
        fontSize * 0.8,
        fontSize * 0.8 +
          image.letterSpacing
      ),
      usableWidth /
        Math.max(
          1,
          text.length
        )
    );

  const startX =
    width / 2 -
    (
      spacing *
      Math.max(
        0,
        text.length - 1
      )
    ) /
      2;

  let characters = "";

  for (
    let i = 0;
    i < text.length;
    i += 1
  ) {
    const char =
      escapeXml(
        text[i]
      );

    const x =
      startX +
      i * spacing;

    const y =
      height / 2 +
      fontSize / 3;

    characters += `
      <text
        x="${x.toFixed(2)}"
        y="${y.toFixed(2)}"
        fill="#1f2937"
        font-size="${fontSize}px"
        font-family="Arial, sans-serif"
        font-weight="700"
        text-anchor="middle"
      >${char}</text>
    `;
  }

  return wrapSvg({
    width,
    height,
    defs:
      background.defs ||
      "",
    content: `
      ${background.rect}

      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="transparent"
      />

      ${characters}
    `,
  });
}

// -----------------------------------------------------
// MIXED CAPTCHA RENDERER
// -----------------------------------------------------
//
// "mixed" mode:
//
// - uses configured character categories
// - moderate noise
// - moderate rotation
// - moderate jitter
// - avoids making the CAPTCHA unnecessarily hard
// -----------------------------------------------------

function generateMixedCaptchaSvg(
  text,
  settings
) {
  const image =
    settings.image;

  const width =
    image.width;

  const height =
    image.height;

  const background =
    getBackgroundDefinition(
      image.backgroundStyle
    );

  const effectiveNoiseLevel =
    Math.max(
      1,
      Math.min(
        8,
        image.noiseLevel
      )
    );

  const effectiveLineCount =
    Math.max(
      1,
      Math.min(
        8,
        image.lineCount
      )
    );

  const effectiveDistortion =
    Math.max(
      1,
      Math.min(
        5,
        image.distortionLevel
      )
    );

  const effectiveLetterSpacing =
    Math.max(
      3,
      Math.min(
        18,
        image.letterSpacing
      )
    );

  const fontSize =
    Math.min(
      image.fontSize,
      Math.max(
        18,
        Math.floor(
          height * 0.48
        )
      )
    );

  // ---------------------------------------------------
  // Lines
  // ---------------------------------------------------

  let noiseLines = "";

  for (
    let i = 0;
    i < effectiveLineCount;
    i += 1
  ) {
    const x1 =
      crypto.randomInt(
        0,
        Math.max(
          1,
          width
        )
      );

    const y1 =
      crypto.randomInt(
        0,
        Math.max(
          1,
          height
        )
      );

    const x2 =
      crypto.randomInt(
        0,
        Math.max(
          1,
          width
        )
      );

    const y2 =
      crypto.randomInt(
        0,
        Math.max(
          1,
          height
        )
      );

    const controlX =
      crypto.randomInt(
        0,
        Math.max(
          1,
          width
        )
      );

    const controlY =
      crypto.randomInt(
        0,
        Math.max(
          1,
          height
        )
      );

    const strokeWidth =
      (
        0.8 +
        Math.random() * 1.2
      ).toFixed(2);

    noiseLines += `
      <path
        d="M${x1} ${y1}
           Q${controlX} ${controlY}
           ${x2} ${y2}"
        stroke="${randomHsl(55, 45)}"
        stroke-width="${strokeWidth}"
        fill="none"
        opacity="0.42"
      />
    `;
  }

  // ---------------------------------------------------
  // Dots
  // ---------------------------------------------------

  const dotCount =
    effectiveNoiseLevel * 10;

  let noiseDots = "";

  for (
    let i = 0;
    i < dotCount;
    i += 1
  ) {
    const cx =
      crypto.randomInt(
        0,
        Math.max(
          1,
          width
        )
      );

    const cy =
      crypto.randomInt(
        0,
        Math.max(
          1,
          height
        )
      );

    const radius =
      0.5 +
      Math.random() * 1.5;

    noiseDots += `
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius.toFixed(2)}"
        fill="${randomHsl(65, 45)}"
        opacity="0.32"
      />
    `;
  }

  // ---------------------------------------------------
  // Character positions
  // ---------------------------------------------------

  const availableWidth =
    Math.max(
      30,
      width - 30
    );

  const desiredSpacing =
    Math.max(
      16,
      fontSize * 0.65 +
        effectiveLetterSpacing
    );

  const actualSpacing =
    Math.min(
      desiredSpacing,
      availableWidth /
        Math.max(
          1,
          text.length
        )
    );

  const contentWidth =
    actualSpacing *
    Math.max(
      0,
      text.length - 1
    );

  const startX =
    Math.max(
      15,
      (
        width -
        contentWidth
      ) /
        2
    );

  // ---------------------------------------------------
  // Characters
  // ---------------------------------------------------

  let characters = "";

  for (
    let i = 0;
    i < text.length;
    i += 1
  ) {
    const char =
      escapeXml(
        text[i]
      );

    const jitterX =
      Math.random() *
        effectiveDistortion *
        2 -
      effectiveDistortion;

    const jitterY =
      Math.random() *
        effectiveDistortion *
        2 -
      effectiveDistortion;

    const x =
      startX +
      i * actualSpacing +
      jitterX;

    const y =
      height / 2 +
      fontSize / 3 +
      jitterY;

    const rotation =
      Math.round(
        Math.random() *
          effectiveDistortion *
          6 -
        effectiveDistortion *
          3
      );

    const color =
      randomHsl(
        75,
        30
      );

    const fontWeight =
      Math.random() > 0.5
        ? 700
        : 600;

    const fontFamily =
      Math.random() > 0.5
        ? "Arial, sans-serif"
        : "Verdana, sans-serif";

    characters += `
      <text
        x="${x.toFixed(2)}"
        y="${y.toFixed(2)}"
        fill="${color}"
        font-size="${fontSize}px"
        font-family="${fontFamily}"
        font-weight="${fontWeight}"
        text-anchor="middle"
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

  return wrapSvg({
    width,
    height,
    defs:
      background.defs ||
      "",
    content: `
      ${background.rect}

      ${noiseLines}

      ${noiseDots}

      ${characters}
    `,
  });
}

// -----------------------------------------------------
// IMAGE CAPTCHA RENDERER
// -----------------------------------------------------
//
// "image" mode intentionally uses stronger visual
// obfuscation than "mixed":
//
// - more noise
// - more lines
// - more jitter
// - more rotation
// - optional symbols
// - stronger character variation
// -----------------------------------------------------

function generateImageCaptchaSvg(
  text,
  settings
) {
  const image =
    settings.image;

  const width =
    image.width;

  const height =
    image.height;

  const background =
    getBackgroundDefinition(
      image.backgroundStyle
    );

  const noiseLevel =
    image.noiseLevel;

  const lineCount =
    image.lineCount;

  const distortionLevel =
    image.distortionLevel;

  const letterSpacing =
    image.letterSpacing;

  const fontSize =
    Math.min(
      image.fontSize,
      Math.max(
        18,
        Math.floor(
          height * 0.52
        )
      )
    );

  // ---------------------------------------------------
  // Noise lines
  // ---------------------------------------------------

  let noiseLines = "";

  for (
    let i = 0;
    i < lineCount;
    i += 1
  ) {
    const x1 =
      crypto.randomInt(
        0,
        Math.max(
          1,
          width
        )
      );

    const y1 =
      crypto.randomInt(
        0,
        Math.max(
          1,
          height
        )
      );

    const x2 =
      crypto.randomInt(
        0,
        Math.max(
          1,
          width
        )
      );

    const y2 =
      crypto.randomInt(
        0,
        Math.max(
          1,
          height
        )
      );

    const controlX =
      crypto.randomInt(
        0,
        Math.max(
          1,
          width
        )
      );

    const controlY =
      crypto.randomInt(
        0,
        Math.max(
          1,
          height
        )
      );

    const strokeWidth =
      (
        0.8 +
        Math.random() *
          Math.max(
            0.5,
            1 +
              distortionLevel /
                5
          )
      ).toFixed(2);

    noiseLines += `
      <path
        d="M${x1} ${y1}
           Q${controlX} ${controlY}
           ${x2} ${y2}"
        stroke="${randomHsl(55, 45)}"
        stroke-width="${strokeWidth}"
        fill="none"
        opacity="0.48"
      />
    `;
  }

  // ---------------------------------------------------
  // Noise dots
  // ---------------------------------------------------

  const dotCount =
    noiseLevel * 20;

  let noiseDots = "";

  for (
    let i = 0;
    i < dotCount;
    i += 1
  ) {
    const cx =
      crypto.randomInt(
        0,
        Math.max(
          1,
          width
        )
      );

    const cy =
      crypto.randomInt(
        0,
        Math.max(
          1,
          height
        )
      );

    const radius =
      0.5 +
      Math.random() * 1.8;

    noiseDots += `
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius.toFixed(2)}"
        fill="${randomHsl(65, 45)}"
        opacity="0.42"
      />
    `;
  }

  // ---------------------------------------------------
  // Character spacing
  // ---------------------------------------------------

  const availableWidth =
    Math.max(
      30,
      width - 30
    );

  const desiredSpacing =
    Math.max(
      15,
      fontSize * 0.62 +
        letterSpacing
    );

  const actualSpacing =
    Math.min(
      desiredSpacing,
      availableWidth /
        Math.max(
          1,
          text.length
        )
    );

  const contentWidth =
    actualSpacing *
    Math.max(
      0,
      text.length - 1
    );

  const startX =
    Math.max(
      15,
      (
        width -
        contentWidth
      ) /
        2
    );

  // ---------------------------------------------------
  // Characters
  // ---------------------------------------------------

  let characters = "";

  for (
    let i = 0;
    i < text.length;
    i += 1
  ) {
    const char =
      escapeXml(
        text[i]
      );

    const jitterX =
      distortionLevel > 0
        ? Math.random() *
            distortionLevel *
            2 -
          distortionLevel
        : 0;

    const jitterY =
      distortionLevel > 0
        ? Math.random() *
            distortionLevel *
            3 -
          distortionLevel *
            1.5
        : 0;

    const x =
      startX +
      i * actualSpacing +
      jitterX;

    const y =
      height / 2 +
      fontSize / 3 +
      jitterY;

    const rotation =
      distortionLevel > 0
        ? Math.round(
            Math.random() *
              distortionLevel *
              8 -
            distortionLevel *
              4
          )
        : 0;

    const color =
      randomHsl(
        75,
        28
      );

    const fontWeight =
      Math.random() > 0.5
        ? 700
        : 600;

    const fontFamily =
      Math.random() > 0.5
        ? "Arial, sans-serif"
        : "Verdana, sans-serif";

    characters += `
      <text
        x="${x.toFixed(2)}"
        y="${y.toFixed(2)}"
        fill="${color}"
        font-size="${fontSize}px"
        font-family="${fontFamily}"
        font-weight="${fontWeight}"
        text-anchor="middle"
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

  // ---------------------------------------------------
  // Extra image-level disturbance
  // ---------------------------------------------------

  let distortionDots = "";

  const extraDots =
    Math.max(
      0,
      Math.floor(
        distortionLevel * 8
      )
    );

  for (
    let i = 0;
    i < extraDots;
    i += 1
  ) {
    const cx =
      crypto.randomInt(
        0,
        Math.max(
          1,
          width
        )
      );

    const cy =
      crypto.randomInt(
        0,
        Math.max(
          1,
          height
        )
      );

    distortionDots += `
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${(
          0.7 +
          Math.random() * 1.8
        ).toFixed(2)}"
        fill="${randomHsl(70, 36)}"
        opacity="0.55"
      />
    `;
  }

  return wrapSvg({
    width,
    height,
    defs:
      background.defs ||
      "",
    content: `
      ${background.rect}

      ${noiseLines}

      ${noiseDots}

      ${distortionDots}

      ${characters}
    `,
  });
}

// -----------------------------------------------------
// SELECT RENDERER
// -----------------------------------------------------

function generateCaptchaSvg(
  text,
  settings
) {
  switch (
    settings.captchaType
  ) {
    case "text":
      return generateTextCaptchaSvg(
        text,
        settings
      );

    case "image":
      return generateImageCaptchaSvg(
        text,
        settings
      );

    case "mixed":
    default:
      return generateMixedCaptchaSvg(
        text,
        settings
      );
  }
}

// -----------------------------------------------------
// GENERATE CAPTCHA
// -----------------------------------------------------
//
// Supports:
//
// generateCaptcha(6)
//
// and:
//
// generateCaptcha({
//   captchaType: "image",
//   length: 8,
//   ...
// })
// -----------------------------------------------------

export function generateCaptcha(
  options = {}
) {
  let rawSettings = {};

  // ---------------------------------------------------
  // Backward compatibility:
//  generateCaptcha(6)
// ---------------------------------------------------

  if (
    typeof options === "number"
  ) {
    rawSettings = {
      length: options,
    };
  } else {
    rawSettings =
      options &&
      typeof options === "object"
        ? options
        : {};
  }

  const settings =
    normalizeCaptchaSettings(
      rawSettings
    );

  const captchaLength =
    settings.length;

  const text =
    generateCaptchaText(
      captchaLength,
      settings
    );

  const issuedAt =
    Date.now();

  const expiresAt =
    issuedAt +
    settings.expirySeconds *
      1000;

  // ---------------------------------------------------
  // Encrypted token payload
  // ---------------------------------------------------

  const tokenPayload = {
    version: 2,

    issuedAt,

    expiresAt,

    text,

    captchaType:
      settings.captchaType,

    caseSensitive:
      settings.caseSensitive,

    length:
      captchaLength,
  };

  const token =
    encryptCaptchaPayload(
      tokenPayload
    );

  // ---------------------------------------------------
  // Render according to captchaType
  // ---------------------------------------------------

  const svg =
    generateCaptchaSvg(
      text,
      settings
    );

  return {
    svg,

    token,

    length:
      captchaLength,

    captchaType:
      settings.captchaType,

    expiresAt,

    expiresInSeconds:
      settings.expirySeconds,
  };
}

// -----------------------------------------------------
// VERIFY CAPTCHA TOKEN ONLY
// -----------------------------------------------------
//
// Does NOT compare submitted answer.
//
// Returns:
// - valid
// - text
// - timestamps
// - captcha type
// - case sensitivity
// - length
// -----------------------------------------------------

export function verifyCaptchaToken(
  token
) {
  if (
    !token ||
    typeof token !== "string"
  ) {
    return {
      valid: false,
      reason:
        "Missing captcha token.",
    };
  }

  try {
    const payload =
      decryptCaptchaPayload(
        token
      );

    if (
      !payload ||
      typeof payload !==
        "object"
    ) {
      return {
        valid: false,
        reason:
          "Invalid captcha token.",
      };
    }

    const timestamp =
      Number(
        payload.issuedAt
      );

    const expiresAt =
      Number(
        payload.expiresAt
      );

    const actualSolution =
      payload.text;

    const captchaType =
      normalizeCaptchaType(
        payload.captchaType
      );

    const caseSensitive =
      payload.caseSensitive !==
      false;

    const payloadLength =
      Number(
        payload.length
      );

    // -------------------------------------------------
    // Basic validation
    // -------------------------------------------------

    if (
      Number.isNaN(timestamp) ||
      timestamp <= 0 ||
      !Number.isFinite(
        expiresAt
      ) ||
      expiresAt <= timestamp ||
      typeof actualSolution !==
        "string" ||
      !actualSolution.length
    ) {
      return {
        valid: false,
        reason:
          "Invalid captcha token.",
      };
    }

    if (
      !Number.isInteger(
        payloadLength
      ) ||
      payloadLength < MIN_LENGTH ||
      payloadLength > MAX_LENGTH ||
      payloadLength !==
        actualSolution.length
    ) {
      return {
        valid: false,
        reason:
          "Invalid captcha length.",
      };
    }

    // -------------------------------------------------
    // Future timestamp protection
    // -------------------------------------------------

    const now =
      Date.now();

    if (
      timestamp >
      now
    ) {
      return {
        valid: false,
        reason:
          "Invalid captcha timestamp.",
      };
    }

    // -------------------------------------------------
    // Expiry
    // -------------------------------------------------

    if (
      now >=
      expiresAt
    ) {
      return {
        valid: false,
        reason:
          "Captcha expired. Please refresh.",
      };
    }

    // -------------------------------------------------
    // Token lifetime protection
    // -------------------------------------------------

    const maxServerLifetimeMs =
      24 *
      60 *
      60 *
      1000;

    if (
      now - timestamp >
      maxServerLifetimeMs
    ) {
      return {
        valid: false,
        reason:
          "Captcha token is no longer valid.",
      };
    }

    // -------------------------------------------------
    // Token age sanity protection
    // -------------------------------------------------

    if (
      expiresAt - timestamp >
      maxServerLifetimeMs
    ) {
      return {
        valid: false,
        reason:
          "Invalid captcha expiry.",
      };
    }

    return {
      valid: true,

      text:
        actualSolution,

      timestamp,

      issuedAt:
        timestamp,

      expiresAt,

      captchaType,

      caseSensitive,

      length:
        payloadLength,

      version:
        Number(
          payload.version || 1
        ),
    };
  } catch (error) {
    console.error(
      "❌ CAPTCHA TOKEN VERIFY ERROR:",
      error.message
    );

    return {
      valid: false,
      reason:
        "Failed to verify captcha token.",
    };
  }
}

// -----------------------------------------------------
// VERIFY CAPTCHA SOLUTION
// -----------------------------------------------------
//
// Compatibility helper.
//
// NOTE:
// The main /captcha/solve route should continue using
// the backend-enforced cooldown / attempt / daily-limit
// rules from server/routes/captcha.js.
// -----------------------------------------------------

export function verifyCaptchaSolution(
  userInput,
  token,
  minSeconds = 1.0
) {
  if (
    typeof userInput !==
      "string" ||
    !userInput.trim() ||
    !token
  ) {
    return {
      valid: false,
      reason:
        "Missing input or token",
    };
  }

  const verification =
    verifyCaptchaToken(
      token
    );

  if (
    !verification ||
    !verification.valid
  ) {
    return verification;
  }

  // ---------------------------------------------------
  // Minimum response time
  // ---------------------------------------------------

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
      Number(minSeconds) *
        1000
    ) {
      return {
        valid: false,
        reason:
          "Solved suspiciously fast. Bot detected.",
      };
    }
  }

  // ---------------------------------------------------
  // Case sensitivity
  // ---------------------------------------------------

  const submittedAnswer =
    userInput.trim();

  const caseSensitive =
    verification.caseSensitive !==
    false;

  const isCorrect =
    caseSensitive
      ? submittedAnswer ===
        verification.text
      : submittedAnswer.toLowerCase() ===
        String(
          verification.text
        ).toLowerCase();

  if (!isCorrect) {
    return {
      valid: false,
      reason:
        "Incorrect captcha text. Try again.",
    };
  }

  return {
    valid: true,

    text:
      verification.text,

    timestamp:
      verification.timestamp,

    expiresAt:
      verification.expiresAt,

    captchaType:
      verification.captchaType,

    caseSensitive,
  };
}

// -----------------------------------------------------
// EXPORT DEFAULT
// -----------------------------------------------------

export default {
  generateCaptcha,
  verifyCaptchaToken,
  verifyCaptchaSolution,
  normalizeCaptchaSettings,
};