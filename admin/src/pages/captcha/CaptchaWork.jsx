import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Info,
  Loader2,
  LockKeyhole,
  Palette,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Type,
  WandSparkles,
  X,
} from "lucide-react";

import api from "../../services/api.js";

// ============================================================
// BACKEND LIMITS
// ============================================================

const LIMITS = {
  length: {
    min: 4,
    max: 32,
  },

  expirySeconds: {
    min: 1,
    max: 3600,
  },

  submitCooldownSeconds: {
    min: 0,
    max: 3600,
  },

  dailyLimit: {
    min: 0,
    max: 100000,
  },

  rewardAmount: {
    min: 0,
    max: 100000,
  },

  maxAttempts: {
    min: 1,
    max: 100,
  },

  image: {
    width: {
      min: 120,
      max: 800,
    },

    height: {
      min: 50,
      max: 300,
    },

    fontSize: {
      min: 12,
      max: 100,
    },

    noiseLevel: {
      min: 0,
      max: 20,
    },

    lineCount: {
      min: 0,
      max: 20,
    },

    distortionLevel: {
      min: 0,
      max: 10,
    },

    letterSpacing: {
      min: 0,
      max: 30,
    },
  },
};

// ============================================================
// DEFAULT SETTINGS
// ============================================================

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

  submitCooldownSeconds: 10,

  dailyLimit: 50,

  rewardAmount: 0.5,

  maxAttempts: 5,

  refreshAfterSuccess: true,

  refreshAfterWrongAnswer: true,

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

// ============================================================
// SAFE BOOLEAN HELPER
// ============================================================
//
// Prevents:
//
// Boolean("false") === true
//
// ============================================================

const normalizeBoolean = (
  value,
  fallback
) => {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    if (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "on"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "0" ||
      normalized === "no" ||
      normalized === "off"
    ) {
      return false;
    }
  }

  return fallback;
};

// ============================================================
// NUMBER HELPER
// ============================================================

function clampNumber(
  value,
  min,
  max,
  fallback
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.min(
    max,
    Math.max(
      min,
      number
    )
  );
}

// ============================================================
// NORMALIZE SETTINGS
// ============================================================

const normalizeSettings = (
  incoming = {}
) => {
  const source =
    incoming &&
    typeof incoming ===
      "object"
      ? incoming
      : {};

  const imageSource =
    source.image &&
    typeof source.image ===
      "object"
      ? source.image
      : {};

  const normalizedType =
    String(
      source.captchaType ||
        ""
    )
      .trim()
      .toLowerCase();

  const captchaType =
    [
      "text",
      "mixed",
      "image",
    ].includes(
      normalizedType
    )
      ? normalizedType
      : DEFAULT_SETTINGS.captchaType;

  const normalizedBackground =
    String(
      imageSource.backgroundStyle ||
        ""
    )
      .trim()
      .toLowerCase();

  const backgroundStyle =
    [
      "light",
      "white",
      "gray",
      "gradient",
      "random",
    ].includes(
      normalizedBackground
    )
      ? normalizedBackground
      : DEFAULT_SETTINGS.image.backgroundStyle;

  return {
    ...DEFAULT_SETTINGS,

    ...source,

    enabled:
      normalizeBoolean(
        source.enabled,
        DEFAULT_SETTINGS.enabled
      ),

    captchaType,

    length:
      Math.round(
        clampNumber(
          source.length,
          LIMITS.length.min,
          LIMITS.length.max,
          DEFAULT_SETTINGS.length
        )
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
      String(
        source.symbols ??
          DEFAULT_SETTINGS.symbols
      ),

    caseSensitive:
      normalizeBoolean(
        source.caseSensitive,
        DEFAULT_SETTINGS.caseSensitive
      ),

    expirySeconds:
      Math.round(
        clampNumber(
          source.expirySeconds,
          LIMITS.expirySeconds.min,
          LIMITS.expirySeconds.max,
          DEFAULT_SETTINGS.expirySeconds
        )
      ),

    submitCooldownSeconds:
      Math.round(
        clampNumber(
          source.submitCooldownSeconds,
          LIMITS.submitCooldownSeconds.min,
          LIMITS.submitCooldownSeconds.max,
          DEFAULT_SETTINGS.submitCooldownSeconds
        )
      ),

    dailyLimit:
      Math.round(
        clampNumber(
          source.dailyLimit,
          LIMITS.dailyLimit.min,
          LIMITS.dailyLimit.max,
          DEFAULT_SETTINGS.dailyLimit
        )
      ),

    rewardAmount:
      Number(
        clampNumber(
          source.rewardAmount,
          LIMITS.rewardAmount.min,
          LIMITS.rewardAmount.max,
          DEFAULT_SETTINGS.rewardAmount
        ).toFixed(2)
      ),

    maxAttempts:
      Math.round(
        clampNumber(
          source.maxAttempts,
          LIMITS.maxAttempts.min,
          LIMITS.maxAttempts.max,
          DEFAULT_SETTINGS.maxAttempts
        )
      ),

    refreshAfterSuccess:
      normalizeBoolean(
        source.refreshAfterSuccess,
        DEFAULT_SETTINGS.refreshAfterSuccess
      ),

    refreshAfterWrongAnswer:
      normalizeBoolean(
        source.refreshAfterWrongAnswer,
        DEFAULT_SETTINGS.refreshAfterWrongAnswer
      ),

    image: {
      ...DEFAULT_SETTINGS.image,

      ...imageSource,

      width:
        Math.round(
          clampNumber(
            imageSource.width,
            LIMITS.image.width.min,
            LIMITS.image.width.max,
            DEFAULT_SETTINGS.image.width
          )
        ),

      height:
        Math.round(
          clampNumber(
            imageSource.height,
            LIMITS.image.height.min,
            LIMITS.image.height.max,
            DEFAULT_SETTINGS.image.height
          )
        ),

      fontSize:
        Math.round(
          clampNumber(
            imageSource.fontSize,
            LIMITS.image.fontSize.min,
            LIMITS.image.fontSize.max,
            DEFAULT_SETTINGS.image.fontSize
          )
        ),

      noiseLevel:
        Math.round(
          clampNumber(
            imageSource.noiseLevel,
            LIMITS.image.noiseLevel.min,
            LIMITS.image.noiseLevel.max,
            DEFAULT_SETTINGS.image.noiseLevel
          )
        ),

      lineCount:
        Math.round(
          clampNumber(
            imageSource.lineCount,
            LIMITS.image.lineCount.min,
            LIMITS.image.lineCount.max,
            DEFAULT_SETTINGS.image.lineCount
          )
        ),

      distortionLevel:
        Math.round(
          clampNumber(
            imageSource.distortionLevel,
            LIMITS.image.distortionLevel.min,
            LIMITS.image.distortionLevel.max,
            DEFAULT_SETTINGS.image.distortionLevel
          )
        ),

      letterSpacing:
        Math.round(
          clampNumber(
            imageSource.letterSpacing,
            LIMITS.image.letterSpacing.min,
            LIMITS.image.letterSpacing.max,
            DEFAULT_SETTINGS.image.letterSpacing
          )
        ),

      backgroundStyle,
    },
  };
};

// ============================================================
// API ERROR MESSAGE
// ============================================================

const getApiErrorMessage = (
  error,
  fallback
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.reason ||
    error?.message ||
    fallback
  );
};

// ============================================================
// CHARACTER POOL
// ============================================================

const buildCharacterPool = (
  settings
) => {
  let pool = "";

  if (
    settings.includeLowercase
  ) {
    pool +=
      "abcdefghijkmnpqrstuvwxyz";
  }

  if (
    settings.includeUppercase
  ) {
    pool +=
      "ABCDEFGHJKLMNPQRSTUVWXYZ";
  }

  if (
    settings.includeNumbers
  ) {
    pool +=
      "23456789";
  }

  if (
    settings.includeSymbols
  ) {
    pool += String(
      settings.symbols || ""
    );
  }

  return [
    ...new Set(
      pool.split("")
    ),
  ].join("");
};

// ============================================================
// ADMIN PREVIEW CAPTCHA
// ============================================================

const generatePreviewCaptcha =
  (settings) => {
    const pool =
      buildCharacterPool(
        settings
      );

    if (!pool) {
      return "CAPTCHA";
    }

    const length =
      Math.round(
        clampNumber(
          settings.length,
          LIMITS.length.min,
          LIMITS.length.max,
          DEFAULT_SETTINGS.length
        )
      );

    let output = "";

    for (
      let index = 0;
      index < length;
      index += 1
    ) {
      const randomIndex =
        Math.floor(
          Math.random() *
            pool.length
        );

      output +=
        pool[randomIndex];
    }

    return output;
  };

// ============================================================
// PREVIEW BACKGROUND
// ============================================================

const getPreviewBackground =
  (backgroundStyle) => {
    switch (
      backgroundStyle
    ) {
      case "white":
        return {
          background:
            "#ffffff",
        };

      case "gray":
        return {
          background:
            "#e5e7eb",
        };

      case "gradient":
        return {
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
        };

      case "random": {
        const hue1 =
          Math.floor(
            Math.random() *
              360
          );

        const hue2 =
          Math.floor(
            Math.random() *
              360
          );

        return {
          background:
            `linear-gradient(135deg, hsl(${hue1}, 70%, 95%), hsl(${hue2}, 70%, 92%))`,
        };
      }

      case "light":
      default:
        return {
          background:
            "#f8fafc",
        };
    }
  };

// ============================================================
// FIELD LABEL
// ============================================================

function FieldLabel({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        {Icon ? (
          <Icon className="h-4 w-4 text-slate-500" />
        ) : null}

        <span className="text-sm font-bold text-slate-800">
          {title}
        </span>
      </div>

      {description ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}

// ============================================================
// NUMBER FIELD
// ============================================================

function NumberField({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}) {
  return (
    <div>
      <FieldLabel
        title={label}
        description={description}
      />

      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => {
            const rawValue =
              event.target.value;

            if (
              rawValue === ""
            ) {
              onChange(min);
              return;
            }

            const nextValue =
              Number(
                rawValue
              );

            onChange(
              Number.isFinite(
                nextValue
              )
                ? nextValue
                : min
            );
          }}
          className="
            h-11
            w-full
            rounded-xl
            border
            border-slate-200
            bg-white
            px-3
            pr-16
            text-sm
            font-semibold
            text-slate-800
            outline-none
            transition
            focus:border-slate-400
            focus:ring-2
            focus:ring-slate-100
          "
        />

        {suffix ? (
          <span className="
            pointer-events-none
            absolute
            inset-y-0
            right-3
            flex
            items-center
            text-xs
            font-semibold
            text-slate-400
          ">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================
// TOGGLE FIELD
// ============================================================

function ToggleField({
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!checked)
      }
      className="
        flex
        w-full
        items-start
        justify-between
        gap-4
        rounded-xl
        border
        border-slate-200
        bg-white
        p-4
        text-left
        transition
        hover:border-slate-300
        hover:shadow-sm
      "
    >
      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-800">
          {label}
        </div>

        {description ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      <div className="shrink-0">
        {checked ? (
          <ToggleRight className="h-7 w-7 text-emerald-600" />
        ) : (
          <ToggleLeft className="h-7 w-7 text-slate-400" />
        )}
      </div>
    </button>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CaptchaWork() {
  const [
    settings,
    setSettings,
  ] = useState(
    normalizeSettings(
      DEFAULT_SETTINGS
    )
  );

  const [
    previewText,
    setPreviewText,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState({
    type: "",
    text: "",
  });

  const [
    showAdvanced,
    setShowAdvanced,
  ] = useState(false);

  const [
    previewImageVisible,
    setPreviewImageVisible,
  ] = useState(true);

  // ==========================================================
  // PREVIEW CAPTCHA
  // ==========================================================

  const regeneratePreview =
    useCallback(() => {
      setPreviewText(
        generatePreviewCaptcha(
          settings
        )
      );
    }, [settings]);

  // ==========================================================
  // LOAD SETTINGS
  // ==========================================================

  const loadSettings =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!silent) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setMessage({
          type: "",
          text: "",
        });

        try {
          const response =
            await api.get(
              "/admin/captcha/settings"
            );

          const data =
            response?.data || {};

          if (
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Unable to load CAPTCHA settings."
            );
          }

          const nextSettings =
            normalizeSettings(
              data.settings ??
                data.captchaSettings ??
                data.data ??
                DEFAULT_SETTINGS
            );

          setSettings(
            nextSettings
          );

          setPreviewText(
            generatePreviewCaptcha(
              nextSettings
            )
          );
        } catch (error) {
          console.error(
            "❌ CAPTCHA settings load error:",
            error
          );

          setMessage({
            type: "error",

            text:
              getApiErrorMessage(
                error,
                "Unable to load CAPTCHA settings."
              ),
          });
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ==========================================================
  // UPDATE IMAGE SETTING
  // ==========================================================

  const updateImageSetting =
    useCallback(
      (
        key,
        value
      ) => {
        setSettings(
          (previous) => ({
            ...previous,

            image: {
              ...previous.image,

              [key]:
                value,
            },
          })
        );
      },
      []
    );

  // ==========================================================
  // VALIDATE SETTINGS
  // ==========================================================

  const validateSettings =
    useCallback(
      (source) => {
        const pool =
          buildCharacterPool(
            source
          );

        if (!pool) {
          return (
            "Select at least one character type for CAPTCHA generation."
          );
        }

        if (
          source.includeSymbols &&
          !String(
            source.symbols || ""
          ).trim()
        ) {
          return (
            "Please define at least one symbol when Symbols are enabled."
          );
        }

        if (
          source.length <
            LIMITS.length.min ||
          source.length >
            LIMITS.length.max
        ) {
          return (
            `CAPTCHA length must be between ${LIMITS.length.min} and ${LIMITS.length.max}.`
          );
        }

        if (
          source.expirySeconds <
            LIMITS.expirySeconds.min ||
          source.expirySeconds >
            LIMITS.expirySeconds.max
        ) {
          return (
            `CAPTCHA expiry must be between ${LIMITS.expirySeconds.min} and ${LIMITS.expirySeconds.max} seconds.`
          );
        }

        if (
          source.submitCooldownSeconds <
            LIMITS.submitCooldownSeconds.min ||
          source.submitCooldownSeconds >
            LIMITS.submitCooldownSeconds.max
        ) {
          return (
            `Submit cooldown must be between ${LIMITS.submitCooldownSeconds.min} and ${LIMITS.submitCooldownSeconds.max} seconds.`
          );
        }

        if (
          source.dailyLimit <
            LIMITS.dailyLimit.min ||
          source.dailyLimit >
            LIMITS.dailyLimit.max
        ) {
          return (
            `Daily CAPTCHA limit must be between ${LIMITS.dailyLimit.min} and ${LIMITS.dailyLimit.max}.`
          );
        }

        if (
          source.rewardAmount <
            LIMITS.rewardAmount.min ||
          source.rewardAmount >
            LIMITS.rewardAmount.max
        ) {
          return (
            `Reward amount must be between ₹${LIMITS.rewardAmount.min} and ₹${LIMITS.rewardAmount.max}.`
          );
        }

        if (
          source.maxAttempts <
            LIMITS.maxAttempts.min ||
          source.maxAttempts >
            LIMITS.maxAttempts.max
        ) {
          return (
            `Maximum attempts must be between ${LIMITS.maxAttempts.min} and ${LIMITS.maxAttempts.max}.`
          );
        }

        if (
          ![
            "text",
            "mixed",
            "image",
          ].includes(
            source.captchaType
          )
        ) {
          return (
            "Invalid CAPTCHA type."
          );
        }

        const allowedBackgrounds =
          [
            "light",
            "white",
            "gray",
            "gradient",
            "random",
          ];

        if (
          !allowedBackgrounds.includes(
            source.image
              .backgroundStyle
          )
        ) {
          return (
            "Invalid CAPTCHA background style."
          );
        }

        return "";
      },
      []
    );

  // ==========================================================
  // SAVE SETTINGS
  // ==========================================================

  const handleSave =
    async () => {
      const payload =
        normalizeSettings(
          settings
        );

      const validationError =
        validateSettings(
          payload
        );

      if (validationError) {
        setMessage({
          type: "error",

          text:
            validationError,
        });

        return;
      }

      setSaving(true);

      setMessage({
        type: "",
        text: "",
      });

      try {
        const response =
          await api.put(
            "/admin/captcha/settings",
            {
              settings:
                payload,
            }
          );

        const data =
          response?.data || {};

        if (
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to save CAPTCHA settings."
          );
        }

        const savedSettings =
          normalizeSettings(
            data.settings ??
              data.captchaSettings ??
              payload
          );

        setSettings(
          savedSettings
        );

        setPreviewText(
          generatePreviewCaptcha(
            savedSettings
          )
        );

        setMessage({
          type: "success",

          text:
            data.message ||
            "CAPTCHA settings saved successfully.",
        });
      } catch (error) {
        console.error(
          "❌ CAPTCHA settings save error:",
          error
        );

        setMessage({
          type: "error",

          text:
            getApiErrorMessage(
              error,
              "Unable to save CAPTCHA settings."
            ),
        });
      } finally {
        setSaving(false);
      }
    };

  // ==========================================================
  // CHARACTER SUMMARY
  // ==========================================================

  const characterSummary =
    useMemo(() => {
      const items = [];

      if (
        settings.includeLowercase
      ) {
        items.push(
          "lowercase"
        );
      }

      if (
        settings.includeUppercase
      ) {
        items.push(
          "uppercase"
        );
      }

      if (
        settings.includeNumbers
      ) {
        items.push(
          "numbers"
        );
      }

      if (
        settings.includeSymbols
      ) {
        items.push(
          "symbols"
        );
      }

      return items.length
        ? items.join(
            ", "
          )
        : "none";
    }, [
      settings.includeLowercase,
      settings.includeUppercase,
      settings.includeNumbers,
      settings.includeSymbols,
    ]);

  // ==========================================================
  // PREVIEW BACKGROUND
  // ==========================================================

  const previewBackground =
    useMemo(
      () =>
        getPreviewBackground(
          settings.image
            .backgroundStyle
        ),
      [
        settings.image
          .backgroundStyle,
      ]
    );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="
        flex
        min-h-[420px]
        items-center
        justify-center
      ">
        <div className="
          flex
          items-center
          gap-3
          rounded-2xl
          border
          border-slate-200
          bg-white
          px-5
          py-4
          shadow-sm
        ">
          <Loader2 className="
            h-5
            w-5
            animate-spin
            text-slate-600
          " />

          <span className="
            text-sm
            font-semibold
            text-slate-600
          ">
            Loading CAPTCHA settings...
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="
      min-h-screen
      bg-slate-50
      px-4
      py-5
      sm:px-6
      sm:py-7
      lg:px-8
    ">
      <div className="
        mx-auto
        max-w-7xl
      ">

        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <div className="
          mb-6
          flex
          flex-col
          gap-4
          xl:flex-row
          xl:items-center
          xl:justify-between
        ">
          <div>
            <div className="
              mb-2
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-slate-200
              bg-white
              px-3
              py-1.5
              text-xs
              font-bold
              text-slate-600
            ">
              <ShieldCheck className="
                h-3.5
                w-3.5
              " />

              Security & Earning Controls
            </div>

            <h1 className="
              text-2xl
              font-black
              tracking-tight
              text-slate-900
              sm:text-3xl
            ">
              CAPTCHA Management
            </h1>

            <p className="
              mt-2
              max-w-3xl
              text-sm
              leading-6
              text-slate-500
            ">
              Manage how customer CAPTCHA challenges
              are generated, displayed and rewarded.
              The customer CAPTCHA itself remains
              backend-generated and backend-verified.
            </p>
          </div>

          <div className="
            flex
            flex-wrap
            items-center
            gap-2
          ">
            <button
              type="button"
              onClick={() =>
                loadSettings({
                  silent: true,
                })
              }
              disabled={
                refreshing ||
                saving
              }
              className="
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                font-bold
                text-slate-700
                shadow-sm
                transition
                hover:border-slate-300
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={saving}
              className="
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-slate-900
                px-5
                text-sm
                font-black
                text-white
                shadow-sm
                transition
                hover:bg-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {saving ? (
                <Loader2 className="
                  h-4
                  w-4
                  animate-spin
                " />
              ) : (
                <Save className="
                  h-4
                  w-4
                " />
              )}

              Save Changes
            </button>
          </div>
        </div>

        {/* ====================================================
            MESSAGE
        ==================================================== */}

        {message.text ? (
          <div
            className={`
              mb-6
              flex
              items-start
              gap-3
              rounded-2xl
              border
              px-4
              py-3.5
              text-sm
              font-semibold
              ${
                message.type ===
                "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }
            `}
          >
            {message.type ===
            "success" ? (
              <CheckCircle2 className="
                mt-0.5
                h-5
                w-5
                shrink-0
              " />
            ) : (
              <AlertCircle className="
                mt-0.5
                h-5
                w-5
                shrink-0
              " />
            )}

            <span className="
              min-w-0
              break-words
            ">
              {message.text}
            </span>

            <button
              type="button"
              onClick={() =>
                setMessage({
                  type: "",
                  text: "",
                })
              }
              className="
                ml-auto
                shrink-0
                rounded-lg
                p-1
                transition
                hover:bg-black/5
              "
              aria-label="Dismiss"
            >
              <X className="
                h-4
                w-4
              " />
            </button>
          </div>
        ) : null}

        {/* ====================================================
            STATUS CARDS
        ==================================================== */}

        <div className="
          mb-6
          grid
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        ">
          <div className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
          ">
            <div className="
              mb-3
              flex
              items-center
              justify-between
            ">
              <span className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-slate-400
              ">
                Status
              </span>

              {settings.enabled ? (
                <span className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-emerald-50
                  px-2.5
                  py-1
                  text-[11px]
                  font-black
                  text-emerald-700
                ">
                  <CheckCircle2 className="
                    h-3
                    w-3
                  " />
                  Enabled
                </span>
              ) : (
                <span className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-red-50
                  px-2.5
                  py-1
                  text-[11px]
                  font-black
                  text-red-700
                ">
                  <EyeOff className="
                    h-3
                    w-3
                  " />
                  Disabled
                </span>
              )}
            </div>

            <div className="
              text-xl
              font-black
              text-slate-900
            ">
              {settings.enabled
                ? "Customer CAPTCHA ON"
                : "Customer CAPTCHA OFF"}
            </div>
          </div>

          <div className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
          ">
            <div className="
              mb-3
              flex
              items-center
              justify-between
            ">
              <span className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-slate-400
              ">
                Mode
              </span>

              <Settings2 className="
                h-4
                w-4
                text-slate-400
              " />
            </div>

            <div className="
              text-xl
              font-black
              capitalize
              text-slate-900
            ">
              {settings.captchaType}
            </div>

            <p className="
              mt-1
              text-xs
              text-slate-500
            ">
              {settings.length} characters
            </p>
          </div>

          <div className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
          ">
            <div className="
              mb-3
              flex
              items-center
              justify-between
            ">
              <span className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-slate-400
              ">
                Reward
              </span>

              <Sparkles className="
                h-4
                w-4
                text-slate-400
              " />
            </div>

            <div className="
              text-xl
              font-black
              text-slate-900
            ">
              ₹
              {Number(
                settings.rewardAmount
              ).toFixed(2)}
            </div>

            <p className="
              mt-1
              text-xs
              text-slate-500
            ">
              Per valid CAPTCHA
            </p>
          </div>

          <div className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
          ">
            <div className="
              mb-3
              flex
              items-center
              justify-between
            ">
              <span className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-slate-400
              ">
                Timing
              </span>

              <Clock3 className="
                h-4
                w-4
                text-slate-400
              " />
            </div>

            <div className="
              text-xl
              font-black
              text-slate-900
            ">
              {settings.expirySeconds}s
            </div>

            <p className="
              mt-1
              text-xs
              text-slate-500
            ">
              {settings.submitCooldownSeconds}s
              {" "}
              submit cooldown
            </p>
          </div>
        </div>

        {/* ====================================================
            MAIN GRID
        ==================================================== */}

        <div className="
          grid
          gap-6
          xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]
        ">

          {/* ==================================================
              LEFT SETTINGS
          ================================================== */}

          <section className="
            space-y-6
          ">

            {/* =================================================
                GENERAL SETTINGS
            ================================================= */}

            <div className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              sm:p-6
            ">
              <div className="
                mb-5
                flex
                items-start
                justify-between
                gap-4
              ">
                <div>
                  <h2 className="
                    text-lg
                    font-black
                    text-slate-900
                  ">
                    General Settings
                  </h2>

                  <p className="
                    mt-1
                    text-sm
                    leading-6
                    text-slate-500
                  ">
                    Main CAPTCHA behavior controls.
                  </p>
                </div>

                <Settings2 className="
                  h-5
                  w-5
                  text-slate-400
                " />
              </div>

              <div className="space-y-3">
                <ToggleField
                  label="Enable Customer CAPTCHA"
                  description="When disabled, customers cannot receive new CAPTCHA earning tasks."
                  checked={
                    settings.enabled
                  }
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        enabled:
                          value,
                      })
                    )
                  }
                />

                <ToggleField
                  label="Refresh After Successful Submit"
                  description="Create a fresh CAPTCHA after a valid answer."
                  checked={
                    settings.refreshAfterSuccess
                  }
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        refreshAfterSuccess:
                          value,
                      })
                    )
                  }
                />

                <ToggleField
                  label="Refresh After Wrong Answer"
                  description="Allow the customer interface to request a replacement after an incorrect answer."
                  checked={
                    settings.refreshAfterWrongAnswer
                  }
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        refreshAfterWrongAnswer:
                          value,
                      })
                    )
                  }
                />
              </div>
            </div>

            {/* =================================================
                CAPTCHA TYPE
            ================================================= */}

            <div className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              sm:p-6
            ">
              <div className="mb-5">
                <h2 className="
                  text-lg
                  font-black
                  text-slate-900
                ">
                  CAPTCHA Type
                </h2>

                <p className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-500
                ">
                  Choose the configured CAPTCHA mode.
                </p>
              </div>

              <div className="
                grid
                gap-3
                sm:grid-cols-3
              ">
                {[
                  {
                    value: "text",
                    title: "Text",
                    description:
                      "Character-focused challenge.",
                    icon: Type,
                  },
                  {
                    value: "mixed",
                    title: "Mixed",
                    description:
                      "Letters, numbers and optional symbols.",
                    icon: WandSparkles,
                  },
                  {
                    value: "image",
                    title: "Image",
                    description:
                      "Image-oriented CAPTCHA rendering.",
                    icon: ImageIcon,
                  },
                ].map(
                  (option) => {
                    const selected =
                      settings.captchaType ===
                      option.value;

                    const Icon =
                      option.icon;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          setSettings(
                            (previous) => ({
                              ...previous,
                              captchaType:
                                option.value,
                            })
                          )
                        }
                        className={`
                          rounded-2xl
                          border
                          p-4
                          text-left
                          transition
                          ${
                            selected
                              ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                              : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:shadow-sm"
                          }
                        `}
                      >
                        <div className="
                          mb-3
                          flex
                          items-center
                          justify-between
                        ">
                          <Icon
                            className={`
                              h-5
                              w-5
                              ${
                                selected
                                  ? "text-white"
                                  : "text-slate-500"
                              }
                            `}
                          />

                          {selected ? (
                            <CheckCircle2 className="
                              h-4
                              w-4
                            " />
                          ) : null}
                        </div>

                        <div className="
                          text-sm
                          font-black
                        ">
                          {option.title}
                        </div>

                        <p className={`
                          mt-1
                          text-xs
                          leading-5
                          ${
                            selected
                              ? "text-slate-300"
                              : "text-slate-500"
                          }
                        `}>
                          {
                            option.description
                          }
                        </p>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="
                mt-5
                grid
                gap-4
                sm:grid-cols-2
              ">
                <NumberField
                  label="CAPTCHA Length"
                  description="Number of characters generated in each challenge."
                  value={
                    settings.length
                  }
                  min={
                    LIMITS.length.min
                  }
                  max={
                    LIMITS.length.max
                  }
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        length:
                          Math.round(
                            value
                          ),
                      })
                    )
                  }
                  suffix="chars"
                />

                <ToggleField
                  label="Case Sensitive"
                  description="Uppercase and lowercase characters must match exactly."
                  checked={
                    settings.caseSensitive
                  }
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        caseSensitive:
                          value,
                      })
                    )
                  }
                />
              </div>
            </div>

            {/* =================================================
                CHARACTER SET
            ================================================= */}

            <div className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              sm:p-6
            ">
              <div className="
                mb-5
                flex
                items-start
                justify-between
                gap-4
              ">
                <div>
                  <h2 className="
                    text-lg
                    font-black
                    text-slate-900
                  ">
                    Character Set
                  </h2>

                  <p className="
                    mt-1
                    text-sm
                    leading-6
                    text-slate-500
                  ">
                    Select which character categories the
                    backend may use.
                  </p>
                </div>

                <Type className="
                  h-5
                  w-5
                  text-slate-400
                " />
              </div>

              <div className="
                grid
                gap-3
                sm:grid-cols-2
              ">
                <ToggleField
                  label="Lowercase Letters"
                  description="a-z (confusing characters removed by backend generator)"
                  checked={
                    settings.includeLowercase
                  }
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        includeLowercase:
                          value,
                      })
                    )
                  }
                />

                <ToggleField
                  label="Uppercase Letters"
                  description="A-Z (confusing characters removed by backend generator)"
                  checked={
                    settings.includeUppercase
                  }
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        includeUppercase:
                          value,
                      })
                    )
                  }
                />

                <ToggleField
                  label="Numbers"
                  description="Numbers from the backend CAPTCHA pool."
                  checked={
                    settings.includeNumbers
                  }
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        includeNumbers:
                          value,
                      })
                    )
                  }
                />

                <ToggleField
                  label="Symbols"
                  description="Use only the symbols configured below."
                  checked={
                    settings.includeSymbols
                  }
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        includeSymbols:
                          value,
                      })
                    )
                  }
                />
              </div>

              {settings.includeSymbols ? (
                <div className="mt-4">
                  <FieldLabel
                    title="Allowed Symbols"
                    description='Example: @#$%^&* — only these characters can be used.'
                  />

                  <input
                    type="text"
                    value={
                      settings.symbols
                    }
                    maxLength={64}
                    onChange={(event) =>
                      setSettings(
                        (previous) => ({
                          ...previous,
                          symbols:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      font-mono
                      text-sm
                      font-bold
                      tracking-wider
                      text-slate-800
                      outline-none
                      focus:border-slate-400
                      focus:ring-2
                      focus:ring-slate-100
                    "
                    placeholder="@#$%^&*"
                  />

                  <div className="
                    mt-2
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-slate-500
                  ">
                    <Info className="
                      h-3.5
                      w-3.5
                    " />

                    Character pool:
                    {" "}
                    <span className="
                      font-bold
                      text-slate-700
                    ">
                      {
                        characterSummary
                      }
                    </span>
                  </div>
                </div>
              ) : (
                <div className="
                  mt-4
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-xs
                  font-semibold
                  text-slate-500
                ">
                  Symbols are currently disabled.
                  Enable Symbols to allow values such as
                  <span className="
                    mx-1
                    font-mono
                    font-bold
                    text-slate-700
                  ">
                    dghg263@@@%^
                  </span>
                  in generated CAPTCHA.
                </div>
              )}
            </div>

            {/* =================================================
                EARNING + SECURITY
            ================================================= */}

            <div className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              sm:p-6
            ">
              <div className="mb-5">
                <h2 className="
                  text-lg
                  font-black
                  text-slate-900
                ">
                  Timing, Reward & Security
                </h2>

                <p className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-500
                ">
                  These values control the customer CAPTCHA
                  earning workflow on the server.
                </p>
              </div>

              <div className="
                grid
                gap-5
                sm:grid-cols-2
                lg:grid-cols-3
              ">
                <NumberField
                  label="CAPTCHA Expiry"
                  description="How long a generated CAPTCHA remains valid."
                  value={
                    settings.expirySeconds
                  }
                  min={
                    LIMITS.expirySeconds.min
                  }
                  max={
                    LIMITS.expirySeconds.max
                  }
                  suffix="sec"
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        expirySeconds:
                          Math.round(
                            value
                          ),
                      })
                    )
                  }
                />

                <NumberField
                  label="Submit Cooldown"
                  description="Minimum time between customer submissions."
                  value={
                    settings.submitCooldownSeconds
                  }
                  min={
                    LIMITS.submitCooldownSeconds.min
                  }
                  max={
                    LIMITS.submitCooldownSeconds.max
                  }
                  suffix="sec"
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        submitCooldownSeconds:
                          Math.round(
                            value
                          ),
                      })
                    )
                  }
                />

                <NumberField
                  label="Daily CAPTCHA Limit"
                  description="Maximum successfully rewarded CAPTCHA tasks per customer per day."
                  value={
                    settings.dailyLimit
                  }
                  min={
                    LIMITS.dailyLimit.min
                  }
                  max={
                    LIMITS.dailyLimit.max
                  }
                  suffix="tasks"
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        dailyLimit:
                          Math.round(
                            value
                          ),
                      })
                    )
                  }
                />

                <NumberField
                  label="Reward Per CAPTCHA"
                  description="Wallet credit for one valid CAPTCHA."
                  value={
                    settings.rewardAmount
                  }
                  min={
                    LIMITS.rewardAmount.min
                  }
                  max={
                    LIMITS.rewardAmount.max
                  }
                  step={0.01}
                  suffix="₹"
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        rewardAmount:
                          Number(
                            Math.max(
                              0,
                              value
                            ).toFixed(2)
                          ),
                      })
                    )
                  }
                />

                <NumberField
                  label="Maximum Attempts"
                  description="Maximum submissions allowed for one CAPTCHA."
                  value={
                    settings.maxAttempts
                  }
                  min={
                    LIMITS.maxAttempts.min
                  }
                  max={
                    LIMITS.maxAttempts.max
                  }
                  suffix="tries"
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        maxAttempts:
                          Math.round(
                            value
                          ),
                      })
                    )
                  }
                />
              </div>
            </div>

            {/* =================================================
                ADVANCED IMAGE SETTINGS
            ================================================= */}

            <div className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              sm:p-6
            ">
              <button
                type="button"
                onClick={() =>
                  setShowAdvanced(
                    (previous) =>
                      !previous
                  )
                }
                className="
                  flex
                  w-full
                  items-center
                  justify-between
                  gap-4
                  text-left
                "
              >
                <div>
                  <h2 className="
                    text-lg
                    font-black
                    text-slate-900
                  ">
                    Advanced Image CAPTCHA
                  </h2>

                  <p className="
                    mt-1
                    text-sm
                    leading-6
                    text-slate-500
                  ">
                    Visual rendering controls supported by the backend generator.
                  </p>
                </div>

                {showAdvanced ? (
                  <EyeOff className="
                    h-5
                    w-5
                    text-slate-400
                  " />
                ) : (
                  <Eye className="
                    h-5
                    w-5
                    text-slate-400
                  " />
                )}
              </button>

              {showAdvanced ? (
                <div className="
                  mt-6
                  space-y-5
                ">
                  <div className="
                    grid
                    gap-5
                    sm:grid-cols-2
                    lg:grid-cols-3
                  ">
                    <NumberField
                      label="Image Width"
                      description="Rendered CAPTCHA image width."
                      value={
                        settings.image.width
                      }
                      min={
                        LIMITS.image.width.min
                      }
                      max={
                        LIMITS.image.width.max
                      }
                      suffix="px"
                      onChange={(value) =>
                        updateImageSetting(
                          "width",
                          Math.round(
                            value
                          )
                        )
                      }
                    />

                    <NumberField
                      label="Image Height"
                      description="Rendered CAPTCHA image height."
                      value={
                        settings.image.height
                      }
                      min={
                        LIMITS.image.height.min
                      }
                      max={
                        LIMITS.image.height.max
                      }
                      suffix="px"
                      onChange={(value) =>
                        updateImageSetting(
                          "height",
                          Math.round(
                            value
                          )
                        )
                      }
                    />

                    <NumberField
                      label="Font Size"
                      description="Character font size inside image."
                      value={
                        settings.image.fontSize
                      }
                      min={
                        LIMITS.image.fontSize.min
                      }
                      max={
                        LIMITS.image.fontSize.max
                      }
                      suffix="px"
                      onChange={(value) =>
                        updateImageSetting(
                          "fontSize",
                          Math.round(
                            value
                          )
                        )
                      }
                    />

                    <NumberField
                      label="Noise Level"
                      description="Background noise intensity."
                      value={
                        settings.image.noiseLevel
                      }
                      min={
                        LIMITS.image.noiseLevel.min
                      }
                      max={
                        LIMITS.image.noiseLevel.max
                      }
                      suffix="/ 20"
                      onChange={(value) =>
                        updateImageSetting(
                          "noiseLevel",
                          Math.round(
                            value
                          )
                        )
                      }
                    />

                    <NumberField
                      label="Line Count"
                      description="Interference line count."
                      value={
                        settings.image.lineCount
                      }
                      min={
                        LIMITS.image.lineCount.min
                      }
                      max={
                        LIMITS.image.lineCount.max
                      }
                      suffix="lines"
                      onChange={(value) =>
                        updateImageSetting(
                          "lineCount",
                          Math.round(
                            value
                          )
                        )
                      }
                    />

                    <NumberField
                      label="Distortion"
                      description="Character distortion intensity."
                      value={
                        settings.image.distortionLevel
                      }
                      min={
                        LIMITS.image.distortionLevel.min
                      }
                      max={
                        LIMITS.image.distortionLevel.max
                      }
                      suffix="/ 10"
                      onChange={(value) =>
                        updateImageSetting(
                          "distortionLevel",
                          Math.round(
                            value
                          )
                        )
                      }
                    />

                    <NumberField
                      label="Letter Spacing"
                      description="Space between generated characters."
                      value={
                        settings.image.letterSpacing
                      }
                      min={
                        LIMITS.image.letterSpacing.min
                      }
                      max={
                        LIMITS.image.letterSpacing.max
                      }
                      suffix="px"
                      onChange={(value) =>
                        updateImageSetting(
                          "letterSpacing",
                          Math.round(
                            value
                          )
                        )
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel
                      icon={
                        Palette
                      }
                      title="Background Style"
                      description="Background styles supported by the backend generator."
                    />

                    <div className="
                      grid
                      gap-3
                      sm:grid-cols-3
                      lg:grid-cols-5
                    ">
                      {[
                        {
                          value:
                            "light",
                          label:
                            "Light",
                        },
                        {
                          value:
                            "white",
                          label:
                            "White",
                        },
                        {
                          value:
                            "gray",
                          label:
                            "Gray",
                        },
                        {
                          value:
                            "gradient",
                          label:
                            "Gradient",
                        },
                        {
                          value:
                            "random",
                          label:
                            "Random",
                        },
                      ].map(
                        (option) => {
                          const selected =
                            settings
                              .image
                              .backgroundStyle ===
                            option.value;

                          return (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              onClick={() =>
                                updateImageSetting(
                                  "backgroundStyle",
                                  option.value
                                )
                              }
                              className={`
                                rounded-xl
                                border
                                px-4
                                py-3
                                text-sm
                                font-bold
                                transition
                                ${
                                  selected
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                }
                              `}
                            >
                              {
                                option.label
                              }
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="
                    rounded-2xl
                    border
                    border-amber-200
                    bg-amber-50
                    p-4
                  ">
                    <div className="
                      flex
                      items-start
                      gap-3
                    ">
                      <CircleHelp className="
                        mt-0.5
                        h-5
                        w-5
                        shrink-0
                        text-amber-600
                      " />

                      <div>
                        <div className="
                          text-sm
                          font-black
                          text-amber-800
                        ">
                          Backend enforcement required
                        </div>

                        <p className="
                          mt-1
                          text-xs
                          leading-5
                          text-amber-700
                        ">
                          These values are only configuration
                          controls in the admin panel. Customer
                          CAPTCHA generation and verification
                          remain server-side.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* ==================================================
              RIGHT PREVIEW
          ================================================== */}

          <aside className="
            xl:sticky
            xl:top-6
            xl:self-start
          ">
            <div className="
              overflow-hidden
              rounded-3xl
              border
              border-slate-200
              bg-white
              shadow-sm
            ">

              {/* ----------------------------------------------
                  PREVIEW HEADER
              ----------------------------------------------- */}

              <div className="
                border-b
                border-slate-200
                p-5
              ">
                <div className="
                  flex
                  items-start
                  justify-between
                  gap-4
                ">
                  <div>
                    <div className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      bg-slate-100
                      px-2.5
                      py-1
                      text-[11px]
                      font-black
                      text-slate-600
                    ">
                      <Eye className="
                        h-3
                        w-3
                      " />

                      Live Preview
                    </div>

                    <h2 className="
                      mt-3
                      text-xl
                      font-black
                      text-slate-900
                    ">
                      Customer CAPTCHA
                    </h2>

                    <p className="
                      mt-1
                      text-xs
                      leading-5
                      text-slate-500
                    ">
                      Preview only. Actual CAPTCHA comes
                      from the backend.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImageVisible(
                        (previous) =>
                          !previous
                      )
                    }
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      p-2
                      text-slate-500
                      transition
                      hover:bg-slate-50
                    "
                    aria-label={
                      previewImageVisible
                        ? "Hide preview"
                        : "Show preview"
                    }
                  >
                    {previewImageVisible ? (
                      <EyeOff className="
                        h-4
                        w-4
                      " />
                    ) : (
                      <Eye className="
                        h-4
                        w-4
                      " />
                    )}
                  </button>
                </div>
              </div>

              {/* ----------------------------------------------
                  PREVIEW AREA
              ----------------------------------------------- */}

              <div className="p-5">
                {previewImageVisible ? (
                  <div className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-100
                    p-4
                  ">
                    <div
                      className="
                        relative
                        flex
                        min-h-[150px]
                        w-full
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-200
                      "
                      style={{
                        ...previewBackground,

                        minHeight:
                          Math.max(
                            120,
                            Math.min(
                              220,
                              settings
                                .image
                                .height
                            )
                          ),
                      }}
                    >
                      {Array.from({
                        length:
                          Math.min(
                            80,
                            settings
                              .image
                              .noiseLevel *
                              8
                          ),
                      }).map(
                        (
                          _,
                          index
                        ) => (
                          <span
                            key={
                              `noise-${index}`
                            }
                            className="
                              absolute
                              h-1
                              w-1
                              rounded-full
                              bg-slate-400/30
                            "
                            style={{
                              left:
                                `${(index * 37) % 100}%`,
                              top:
                                `${(index * 61) % 100}%`,
                            }}
                          />
                        )
                      )}

                      {Array.from({
                        length:
                          Math.min(
                            20,
                            settings
                              .image
                              .lineCount
                          ),
                      }).map(
                        (
                          _,
                          index
                        ) => (
                          <span
                            key={
                              `line-${index}`
                            }
                            className="
                              absolute
                              left-0
                              h-px
                              w-full
                              bg-slate-400/30
                            "
                            style={{
                              top:
                                `${15 + ((index * 67) % 70)}%`,

                              transform:
                                `rotate(${
                                  index %
                                    2 ===
                                  0
                                    ? index +
                                      1
                                    : -(
                                        index +
                                        1
                                      )
                                }deg)`,
                            }}
                          />
                        )
                      )}

                      <span
                        className={`
                          relative
                          z-10
                          select-none
                          font-mono
                          font-black
                          ${
                            settings
                              .image
                              .backgroundStyle ===
                            "gray"
                              ? "text-slate-900"
                              : "text-slate-800"
                          }
                        `}
                        style={{
                          fontSize:
                            `${Math.max(
                              20,
                              Math.min(
                                52,
                                settings
                                  .image
                                  .fontSize
                              )
                            )}px`,

                          letterSpacing:
                            `${Math.max(
                              1,
                              Math.min(
                                16,
                                settings
                                  .image
                                  .letterSpacing
                              )
                            )}px`,

                          transform:
                            `skewY(${
                              Math.min(
                                8,
                                settings
                                  .image
                                  .distortionLevel
                              )
                            }deg)`,
                        }}
                      >
                        {previewText ||
                          generatePreviewCaptcha(
                            settings
                          )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="
                    flex
                    min-h-[150px]
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-300
                    bg-slate-50
                    text-sm
                    font-semibold
                    text-slate-400
                  ">
                    Preview hidden
                  </div>
                )}

                {/* ------------------------------------------
                    REGENERATE
                ------------------------------------------- */}

                <button
                  type="button"
                  onClick={
                    regeneratePreview
                  }
                  className="
                    mt-3
                    flex
                    h-10
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-xs
                    font-black
                    text-slate-700
                    transition
                    hover:bg-slate-50
                  "
                >
                  <RefreshCw className="
                    h-3.5
                    w-3.5
                  " />

                  Generate Preview CAPTCHA
                </button>

                {/* ------------------------------------------
                    PREVIEW INFO
                ------------------------------------------- */}

                <div className="
                  mt-5
                  space-y-3
                ">
                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    bg-slate-50
                    px-4
                    py-3
                  ">
                    <span className="
                      text-xs
                      font-bold
                      text-slate-500
                    ">
                      Type
                    </span>

                    <span className="
                      text-xs
                      font-black
                      capitalize
                      text-slate-900
                    ">
                      {settings.captchaType}
                    </span>
                  </div>

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    bg-slate-50
                    px-4
                    py-3
                  ">
                    <span className="
                      text-xs
                      font-bold
                      text-slate-500
                    ">
                      Length
                    </span>

                    <span className="
                      text-xs
                      font-black
                      text-slate-900
                    ">
                      {settings.length}
                      {" "}
                      characters
                    </span>
                  </div>

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    bg-slate-50
                    px-4
                    py-3
                  ">
                    <span className="
                      text-xs
                      font-bold
                      text-slate-500
                    ">
                      Character Mix
                    </span>

                    <span className="
                      max-w-[60%]
                      text-right
                      text-xs
                      font-black
                      capitalize
                      text-slate-900
                    ">
                      {characterSummary}
                    </span>
                  </div>

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    bg-slate-50
                    px-4
                    py-3
                  ">
                    <span className="
                      text-xs
                      font-bold
                      text-slate-500
                    ">
                      Expiry
                    </span>

                    <span className="
                      text-xs
                      font-black
                      text-slate-900
                    ">
                      {settings.expirySeconds}s
                    </span>
                  </div>

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    bg-slate-50
                    px-4
                    py-3
                  ">
                    <span className="
                      text-xs
                      font-bold
                      text-slate-500
                    ">
                      Reward
                    </span>

                    <span className="
                      text-xs
                      font-black
                      text-emerald-700
                    ">
                      ₹
                      {Number(
                        settings.rewardAmount
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* ------------------------------------------
                    SECURITY NOTE
                ------------------------------------------- */}

                <div className="
                  mt-5
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-900
                  p-4
                  text-white
                ">
                  <div className="
                    flex
                    items-start
                    gap-3
                  ">
                    <LockKeyhole className="
                      mt-0.5
                      h-5
                      w-5
                      shrink-0
                      text-slate-300
                    " />

                    <div>
                      <div className="
                        text-sm
                        font-black
                      ">
                        Security Reminder
                      </div>

                      <p className="
                        mt-1
                        text-xs
                        leading-5
                        text-slate-300
                      ">
                        Reward, expiry, cooldown, attempt
                        count, daily limit and CAPTCHA answer
                        validation are controlled by the backend.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================
                QUICK SUMMARY
            ================================================== */}

            <div className="
              mt-5
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
            ">
              <div className="
                mb-4
                flex
                items-center
                gap-2
              ">
                <Info className="
                  h-4
                  w-4
                  text-slate-500
                " />

                <h3 className="
                  text-sm
                  font-black
                  text-slate-900
                ">
                  Current Configuration
                </h3>
              </div>

              <div className="
                grid
                grid-cols-2
                gap-3
                sm:grid-cols-3
              ">
                <div className="
                  rounded-xl
                  bg-slate-50
                  p-3
                ">
                  <div className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-slate-400
                  ">
                    Enabled
                  </div>

                  <div className="
                    mt-1
                    text-sm
                    font-black
                    text-slate-900
                  ">
                    {settings.enabled
                      ? "Yes"
                      : "No"}
                  </div>
                </div>

                <div className="
                  rounded-xl
                  bg-slate-50
                  p-3
                ">
                  <div className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-slate-400
                  ">
                    Daily Limit
                  </div>

                  <div className="
                    mt-1
                    text-sm
                    font-black
                    text-slate-900
                  ">
                    {settings.dailyLimit}
                  </div>
                </div>

                <div className="
                  rounded-xl
                  bg-slate-50
                  p-3
                ">
                  <div className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-slate-400
                  ">
                    Max Attempts
                  </div>

                  <div className="
                    mt-1
                    text-sm
                    font-black
                    text-slate-900
                  ">
                    {settings.maxAttempts}
                  </div>
                </div>

                <div className="
                  rounded-xl
                  bg-slate-50
                  p-3
                ">
                  <div className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-slate-400
                  ">
                    Expiry
                  </div>

                  <div className="
                    mt-1
                    text-sm
                    font-black
                    text-slate-900
                  ">
                    {settings.expirySeconds}s
                  </div>
                </div>

                <div className="
                  rounded-xl
                  bg-slate-50
                  p-3
                ">
                  <div className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-slate-400
                  ">
                    Cooldown
                  </div>

                  <div className="
                    mt-1
                    text-sm
                    font-black
                    text-slate-900
                  ">
                    {settings.submitCooldownSeconds}s
                  </div>
                </div>

                <div className="
                  rounded-xl
                  bg-slate-50
                  p-3
                ">
                  <div className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-slate-400
                  ">
                    Reward
                  </div>

                  <div className="
                    mt-1
                    text-sm
                    font-black
                    text-emerald-700
                  ">
                    ₹
                    {Number(
                      settings.rewardAmount
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ====================================================
            FOOTER NOTE
        ==================================================== */}

        <div className="
          mt-6
          flex
          items-start
          gap-3
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-4
          text-xs
          leading-5
          text-slate-500
          shadow-sm
        ">
          <ShieldCheck className="
            mt-0.5
            h-4
            w-4
            shrink-0
            text-slate-500
          " />

          <span>
            Admin settings are stored in MongoDB.
            Customer CAPTCHA generation, token verification,
            expiration, cooldown, maximum attempts, daily
            limit and wallet reward are enforced server-side.
          </span>
        </div>
      </div>
    </main>
  );
}