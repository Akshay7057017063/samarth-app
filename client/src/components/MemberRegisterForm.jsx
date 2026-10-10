import React, { useState } from "react";
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/* =====================================================
   SHARED NEW MEMBER FORM
===================================================== */

/*
 * Used by:
 *   /dashboard/register
 *
 * Sponsor is display-only.
 *
 * IMPORTANT:
 * The frontend does NOT submit sponsorId.
 * The backend determines the sponsor from the
 * authenticated customer's JWT.
 */

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  position: "left",
  termsAccepted: false,
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MemberRegisterForm({
  sponsorMemberId,
  sponsorName,
  defaultPosition = "left",
  onSubmit,
}) {
  const normalizedDefaultPosition =
    String(
      defaultPosition || ""
    )
      .trim()
      .toLowerCase();

  const safeDefaultPosition =
    ["left", "right"].includes(
      normalizedDefaultPosition
    )
      ? normalizedDefaultPosition
      : "left";

  const [form, setForm] = useState({
    ...emptyForm,
    position: safeDefaultPosition,
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [created, setCreated] =
    useState(null);

  /* ===================================================
     FIELD UPDATE
  =================================================== */

  const setField = (
    key,
    value
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );

    if (error) {
      setError("");
    }
  };

  /* ===================================================
     FORM SUBMIT
  =================================================== */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");

      /* -------------------------------------------------
         CHECK CALLBACK
      ------------------------------------------------- */

      if (
        typeof onSubmit !==
        "function"
      ) {
        setError(
          "Registration service is not configured."
        );
        return;
      }

      /* -------------------------------------------------
         NORMALIZE VALUES
      ------------------------------------------------- */

      const cleanName =
        String(
          form.name || ""
        ).trim();

      const cleanPhone =
        String(
          form.phone || ""
        ).trim();

      const cleanEmail =
        String(
          form.email || ""
        )
          .trim()
          .toLowerCase();

      const cleanPassword =
        String(
          form.password || ""
        );

      const cleanConfirmPassword =
        String(
          form.confirmPassword ||
            ""
        );

      const cleanPosition =
        String(
          form.position || ""
        )
          .trim()
          .toLowerCase();

      /* -------------------------------------------------
         NAME VALIDATION
      ------------------------------------------------- */

      if (!cleanName) {
        setError(
          "Please enter the member's full name."
        );
        return;
      }

      if (cleanName.length < 2) {
        setError(
          "Name must contain at least 2 characters."
        );
        return;
      }

      /* -------------------------------------------------
         PHONE VALIDATION
      ------------------------------------------------- */

      if (!cleanPhone) {
        setError(
          "Please enter the mobile number."
        );
        return;
      }

      if (cleanPhone.length < 5) {
        setError(
          "Please provide a valid mobile number."
        );
        return;
      }

      /* -------------------------------------------------
         EMAIL VALIDATION
      ------------------------------------------------- */

      if (!cleanEmail) {
        setError(
          "Please enter the email address."
        );
        return;
      }

      if (
        !emailRegex.test(
          cleanEmail
        )
      ) {
        setError(
          "Please provide a valid email address."
        );
        return;
      }

      /* -------------------------------------------------
         PASSWORD VALIDATION
      ------------------------------------------------- */

      if (
        cleanPassword.length < 6
      ) {
        setError(
          "Password must contain at least 6 characters."
        );
        return;
      }

      if (
        cleanPassword !==
        cleanConfirmPassword
      ) {
        setError(
          "Password and confirm password do not match."
        );
        return;
      }

      /* -------------------------------------------------
         POSITION VALIDATION
      ------------------------------------------------- */

      if (
        !["left", "right"].includes(
          cleanPosition
        )
      ) {
        setError(
          "Please select Left or Right position."
        );
        return;
      }

      /* -------------------------------------------------
         TERMS
      ------------------------------------------------- */

      if (!form.termsAccepted) {
        setError(
          "Please accept the Terms & Conditions."
        );
        return;
      }

      /* -------------------------------------------------
         SUBMIT
      ------------------------------------------------- */

      setLoading(true);

      try {
        const result =
          await onSubmit({
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            password: cleanPassword,
            confirmPassword:
              cleanConfirmPassword,
            position: cleanPosition,
            termsAccepted: true,
          });

        if (!result?.success) {
          setError(
            result?.message ||
              "Registration failed."
          );
          return;
        }

        /* -----------------------------------------------
           SUCCESS
        ------------------------------------------------ */

        setCreated(
          result?.member || {}
        );

        setForm({
          ...emptyForm,
          position:
            safeDefaultPosition,
        });
      } catch (err) {
        console.error(
          "❌ Member registration form error:",
          err
        );

        setError(
          err?.message ||
            "Registration failed."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ===================================================
     SUCCESS SCREEN
  =================================================== */

  if (created) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm">

        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />

        <h2 className="mt-3 text-lg font-black text-slate-900">
          Member Registration Successful
        </h2>

        <div className="mt-4 space-y-1 text-sm text-slate-600">

          <p>
            Member ID:{" "}
            <span className="font-mono font-bold text-slate-900">
              {created.memberId ||
                "Generated"}
            </span>
          </p>

          <p>
            Status:{" "}
            <span className="font-bold text-orange-600">
              INACTIVE
            </span>
          </p>

          {created.position ? (
            <p>
              Position:{" "}
              <span className="font-bold capitalize text-violet-700">
                {created.position}
              </span>
            </p>
          ) : null}

        </div>

        <div className="mx-auto mt-5 max-w-md rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-left">

          <p className="text-xs font-bold text-orange-700">
            Next Step
          </p>

          <p className="mt-1 text-xs leading-5 text-orange-700/80">
            The new member is inactive. Admin must send
            an activation PIN to the member's registered
            email address before the member can activate
            the account and login.
          </p>

        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          The member can activate the account after
          receiving the 6-digit activation PIN from admin.
        </p>

        <button
          type="button"
          onClick={() => {
            setCreated(null);
            setError("");
          }}
          className="mt-5 rounded-xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg"
        >
          Register Another Member
        </button>

      </div>
    );
  }

  /* ===================================================
     REGISTRATION FORM
  =================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
    >

      {/* =================================================
          SPONSOR - READ ONLY
      ================================================= */}

      <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm">

        <span className="text-slate-500">
          Sponsor:{" "}
        </span>

        <span className="font-mono font-bold text-violet-700">
          {sponsorMemberId ||
            "-"}
        </span>

        {sponsorName ? (
          <span className="text-slate-500">
            {" "}
            ({sponsorName})
          </span>
        ) : null}

      </div>

      {/* =================================================
          FULL NAME
      ================================================= */}

      <div>

        <label className="mb-1 block text-xs font-bold text-slate-600">
          Full Name *
        </label>

        <input
          type="text"
          className={inputClass}
          value={form.name}
          onChange={(event) =>
            setField(
              "name",
              event.target.value
            )
          }
          autoComplete="name"
          maxLength={100}
          disabled={loading}
          required
        />

      </div>

      {/* =================================================
          PHONE + EMAIL
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2">

        <div>

          <label className="mb-1 block text-xs font-bold text-slate-600">
            Mobile Number *
          </label>

          <input
            type="tel"
            className={inputClass}
            value={form.phone}
            onChange={(event) =>
              setField(
                "phone",
                event.target.value
              )
            }
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            disabled={loading}
            required
          />

        </div>

        <div>

          <label className="mb-1 block text-xs font-bold text-slate-600">
            Email *
          </label>

          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(event) =>
              setField(
                "email",
                event.target.value
              )
            }
            autoComplete="email"
            maxLength={150}
            disabled={loading}
            required
          />

        </div>

      </div>

      {/* =================================================
          PASSWORD + CONFIRM PASSWORD
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2">

        <div>

          <label className="mb-1 block text-xs font-bold text-slate-600">
            Password *
          </label>

          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={(event) =>
              setField(
                "password",
                event.target.value
              )
            }
            minLength={6}
            autoComplete="new-password"
            disabled={loading}
            required
          />

        </div>

        <div>

          <label className="mb-1 block text-xs font-bold text-slate-600">
            Confirm Password *
          </label>

          <input
            type="password"
            className={inputClass}
            value={
              form.confirmPassword
            }
            onChange={(event) =>
              setField(
                "confirmPassword",
                event.target.value
              )
            }
            minLength={6}
            autoComplete="new-password"
            disabled={loading}
            required
          />

        </div>

      </div>

      {/* =================================================
          POSITION
      ================================================= */}

      <div>

        <label className="mb-1 block text-xs font-bold text-slate-600">
          Binary Position *
        </label>

        <div className="grid grid-cols-2 gap-3">

          {["left", "right"].map(
            (position) => (
              <button
                key={position}
                type="button"
                disabled={loading}
                onClick={() =>
                  setField(
                    "position",
                    position
                  )
                }
                className={`rounded-xl border px-4 py-3 text-sm font-bold capitalize transition ${
                  form.position ===
                  position
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-violet-200"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {position}
              </button>
            )
          )}

        </div>

        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          The selected position is used for this
          registration. If the selected position is already
          occupied, the server will reject the registration.
        </p>

      </div>

      {/* =================================================
          TERMS
      ================================================= */}

      <label className="flex items-start gap-2 text-xs text-slate-600">

        <input
          type="checkbox"
          checked={
            form.termsAccepted
          }
          onChange={(event) =>
            setField(
              "termsAccepted",
              event.target.checked
            )
          }
          disabled={loading}
          className="mt-0.5"
        />

        <span>
          I accept the Terms &amp;
          Conditions.
        </span>

      </label>

      {/* =================================================
          ERROR
      ================================================= */}

      {error ? (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">

          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>
            {error}
          </span>

        </div>
      ) : null}

      {/* =================================================
          SUBMIT
      ================================================= */}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >

        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}

        {loading
          ? "Registering..."
          : "Register New Member"}

      </button>

    </form>
  );
}