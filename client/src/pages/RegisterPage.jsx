import React, { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Sparkles,
  User,
  Mail,
  Phone,
  Lock,
  Network,
  AlertCircle,
  ArrowRight,
  Gift,
  FileText,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    sponsorCode: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");

    if (ref) {
      setFormData((prev) => ({
        ...prev,
        sponsorCode: ref.toUpperCase(),
      }));
    }
  }, [searchParams]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === "sponsorCode" ? value.toUpperCase() : value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.password.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    // Referral / Sponsor Code is mandatory
    if (!formData.sponsorCode.trim()) {
      setError("Sponsor / Referral Code is required to register.");
      return;
    }

    // Terms validation
    if (!termsAccepted) {
      setError(
        "Please read and accept the Terms & Conditions before registering."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await register({
        ...formData,
        sponsorCode: formData.sponsorCode.trim().toUpperCase(),
      });

      if (res?.success) {
        navigate("/dashboard");
      } else {
        setError(
          res?.message || "Registration failed. Please try again."
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAgreeTerms = () => {
    setTermsAccepted(true);
    setShowTerms(false);
    setError("");
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50 px-4 py-12 text-slate-800 sm:px-6 sm:py-16 lg:px-8">

      {/* ============================================================
          RAINBOW BACKGROUND EFFECTS
      ============================================================ */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Violet */}
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />

        {/* Pink */}
        <div className="absolute right-[-120px] top-[15%] h-96 w-96 rounded-full bg-pink-300/20 blur-3xl" />

        {/* Blue */}
        <div className="absolute bottom-[-140px] left-[10%] h-96 w-96 rounded-full bg-blue-300/15 blur-3xl" />

        {/* Orange */}
        <div className="absolute bottom-[-100px] right-[8%] h-80 w-80 rounded-full bg-orange-300/20 blur-3xl" />

        {/* Emerald */}
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-300/15 blur-3xl" />

        {/* Center ambient */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-200/20 via-pink-200/20 to-orange-200/20" />
      </div>

      {/* Top rainbow line */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-pink-500 via-orange-400 to-emerald-400" />

      {/* ============================================================
          MAIN CONTENT
      ============================================================ */}

      <div className="relative z-10 mx-auto w-full max-w-5xl">

        {/* ============================================================
            PAGE HEADER
        ============================================================ */}

        <div className="mx-auto mb-8 max-w-2xl text-center">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 shadow-sm backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 text-pink-500" />
            Member Registration
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Join{" "}
            <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Samarth Network
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-slate-500 sm:text-sm">
            Create your member account to access available CAPTCHA tasks,
            network features, and your personal dashboard.
          </p>
        </div>

        {/* ============================================================
            REGISTRATION CARD
        ============================================================ */}

        <div className="relative mx-auto w-full max-w-4xl">

          {/* Rainbow outer border */}
          <div className="absolute -inset-[1px] rounded-[25px] bg-gradient-to-r from-violet-400/60 via-pink-400/50 via-orange-300/50 to-emerald-300/50 opacity-70 blur-[1px]" />

          <div className="relative mx-auto grid w-full max-w-4xl overflow-hidden rounded-3xl border border-white bg-white/90 shadow-[0_25px_80px_rgba(100,70,180,0.15)] backdrop-blur-xl lg:grid-cols-5">

            {/* ========================================================
                LEFT PANEL
            ======================================================== */}

            <div className="relative overflow-hidden border-b border-violet-100 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-7 sm:p-8 lg:col-span-2 lg:border-b-0 lg:border-r">

              {/* Decorative glows */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-300/25 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-orange-300/20 blur-3xl" />

              <div className="relative flex h-full flex-col">

                {/* Icon */}
                <div className="mb-6 h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-orange-400 p-[2px] shadow-lg shadow-violet-500/20">
                  <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white">
                    <Sparkles className="h-6 w-6 text-violet-600" />
                  </div>
                </div>

                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
                  Welcome
                </p>

                <h2 className="text-2xl font-black leading-tight text-slate-900">
                  Start Your Journey With{" "}
                  <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                    Samarth
                  </span>
                </h2>

                <p className="mt-4 text-xs leading-6 text-slate-500">
                  Create your account and manage your available member
                  activities from one simple dashboard.
                </p>

                {/* Benefits */}
                <div className="mt-8 space-y-5">

                  {/* Bonus */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50">
                      <Gift className="h-4 w-4 text-emerald-600" />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        ₹50 Welcome Bonus
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        Welcome benefit credited according to applicable
                        platform rules.
                      </p>
                    </div>
                  </div>

                  {/* CAPTCHA */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Daily CAPTCHA Tasks
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        Access available CAPTCHA work through your member
                        dashboard.
                      </p>
                    </div>
                  </div>

                  {/* Network */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50">
                      <Network className="h-4 w-4 text-cyan-600" />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Referral Network
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        Use referral information according to applicable
                        company rules.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom note */}
                <div className="mt-auto pt-8">
                  <div className="rounded-2xl border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />

                      <span className="text-[10px] font-bold text-slate-700">
                        Secure Registration
                      </span>
                    </div>

                    <p className="text-[10px] leading-5 text-slate-500">
                      By creating an account, you agree to follow the
                      applicable company rules and Terms & Conditions.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* ========================================================
                RIGHT FORM
            ======================================================== */}

            <div className="p-6 sm:p-8 lg:col-span-3 lg:p-9">

              {/* Form Header */}
              <div className="mb-6 flex items-center justify-between gap-4">

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Create Account
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Enter your details to complete registration.
                  </p>
                </div>

                <div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 sm:flex">
                  <User className="h-4 w-4 text-violet-600" />
                </div>
              </div>

              {/* Bonus */}
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <Gift className="h-4 w-4 text-emerald-600" />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-emerald-700">
                    Welcome Benefit
                  </p>

                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                    ₹50 welcome benefit subject to applicable platform rules.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ====================================================
                    Sponsor / Referral Code - REQUIRED
                ==================================================== */}
                <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-3.5">

                  <label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-violet-600">
                    <Network className="h-3.5 w-3.5" />
                    Sponsor / Referral Code
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={formData.sponsorCode}
                    onChange={(e) =>
                      handleChange("sponsorCode", e.target.value)
                    }
                    placeholder="e.g. SAM1001"
                    required
                    aria-required="true"
                    className="w-full rounded-xl border border-violet-100 bg-white px-3 py-2.5 font-mono text-xs uppercase text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
                  />

                  <p className="mt-1.5 text-[10px] leading-4 text-violet-500">
                    A valid sponsor / referral code is required to create
                    your account.
                  </p>
                </div>

                {/* Name + Phone */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* Name */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                      Full Name *
                    </label>

                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />

                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleChange("name", e.target.value)
                        }
                        placeholder="Rajesh Kumar"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-10 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                      Mobile Phone *
                    </label>

                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />

                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleChange("phone", e.target.value)
                        }
                        placeholder="9876543210"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-10 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                    Email Address *
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />

                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleChange("email", e.target.value)
                      }
                      placeholder="rajesh@example.com"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-10 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                    Create Password *
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />

                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        handleChange("password", e.target.value)
                      }
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-10 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10"
                    />
                  </div>
                </div>

                {/* Terms */}
                <div
                  className={`rounded-2xl border p-4 transition-all ${
                    termsAccepted
                      ? "border-emerald-200 bg-emerald-50/70"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start gap-3">

                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() =>
                        setTermsAccepted((prev) => !prev)
                      }
                      className="mt-0.5 shrink-0"
                      aria-label="Accept Terms and Conditions"
                    >
                      {termsAccepted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-md border-2 border-slate-300 transition-colors hover:border-violet-500" />
                      )}
                    </button>

                    <div className="flex-1">

                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-violet-600" />

                        <span className="text-xs font-bold text-slate-800">
                          Terms & Conditions
                        </span>
                      </div>

                      <p className="mt-1.5 text-[10px] leading-5 text-slate-500">
                        I have read and understood the Company's Terms &
                        Conditions and agree to follow the applicable
                        rules before using the App or purchasing any
                        Product.
                      </p>

                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="mt-2 text-[10px] font-bold text-violet-600 underline underline-offset-2 transition-colors hover:text-pink-600"
                      >
                        Read More
                      </button>
                    </div>
                  </div>

                  {!termsAccepted && (
                    <div className="mt-3 text-[10px] text-amber-600">
                      Please read and accept the Terms & Conditions to
                      continue.
                    </div>
                  )}

                  {termsAccepted && (
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Terms & Conditions accepted
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.01] hover:shadow-pink-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Login */}
              <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
                Already registered?{" "}
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text font-bold text-transparent transition-opacity hover:opacity-80"
                >
                  Sign In Here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          TERMS & CONDITIONS MODAL
      ============================================================ */}

      {showTerms && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowTerms(false);
            }
          }}
        >
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white bg-white/95 shadow-[0_25px_100px_rgba(50,30,100,0.25)] backdrop-blur-xl">

            {/* Rainbow modal line */}
            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400" />

            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-violet-100 bg-gradient-to-r from-violet-50/90 via-white to-orange-50/90 px-5 py-4 sm:px-6">

              <div>
                <div className="flex items-center gap-2">

                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 p-[1.5px]">
                    <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
                      <FileText className="h-4 w-4 text-violet-600" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-black text-slate-900 sm:text-lg">
                      Terms & Conditions
                    </h2>

                    <p className="mt-0.5 text-[9px] text-slate-400">
                      DIGITAL LYF PVT. LTD.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                aria-label="Close Terms"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Terms */}
            <div className="overflow-y-auto px-5 py-6 sm:px-7">

              {/* Hindi */}
              <section>

                <div className="mb-5">
                  <div className="mb-2 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-600">
                    हिंदी
                  </div>

                  <h3 className="text-xl font-black text-slate-900">
                    DIGITAL LYF PVT. LTD.
                  </h3>

                  <p className="mt-1 text-sm font-bold text-violet-600">
                    कंपनी के नियम एवं शर्तें
                  </p>
                </div>

                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs leading-6 text-amber-800">
                    <strong>महत्वपूर्ण सूचना:</strong> App का उपयोग या
                    Product खरीदने से पहले ग्राहक नीचे दिए गए सभी नियमों
                    एवं लागू शर्तों को ध्यानपूर्वक पढ़कर और समझकर ही
                    आगे बढ़ें।
                  </p>
                </div>

                <div className="space-y-5 text-xs leading-6 text-slate-600">

                  <div>
                    <h4 className="font-bold text-slate-900">
                      नियम 1 – App और Product का शुल्क
                    </h4>
                    <p>
                      कंपनी का App उपयोगकर्ताओं को निःशुल्क (Free of
                      Cost) दिया जा रहा है। ग्राहक से लिया जा रहा
                      ₹3,500 App का शुल्क नहीं है, बल्कि कंपनी के
                      Product/Package का शुल्क है। Product/Package की
                      पूरी जानकारी और लागू शर्तें खरीदारी से पहले
                      ग्राहक को स्पष्ट रूप से बताई जाएंगी।
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      नियम 2 – App/Software में तकनीकी समस्या
                    </h4>
                    <p>
                      कंपनी के App/Software में कभी-कभी Technical Issue,
                      Maintenance या Server से संबंधित समस्या हो सकती
                      है। ऐसी स्थिति में App Slow हो सकता है या कुछ
                      समय के लिए बंद रह सकता है। कंपनी ऐसी तकनीकी
                      समस्या को सामान्यतः लगभग 2 दिनों के भीतर हल
                      करने का प्रयास करेगी। इस दौरान उपयोगकर्ताओं से
                      सहयोग की अपेक्षा की जाती है।
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      नियम 3 – Payment Processing
                    </h4>
                    <p>
                      यदि निर्धारित Payment Day रविवार, Bank Holiday
                      या Company Holiday के दिन आता है, तो उस दिन
                      Payment Process नहीं किया जाएगा। ऐसी स्थिति में
                      अगले Working Day, जिस दिन Bank/Payment System
                      चालू होगा, उस दिन Payment Process किया जाएगा।
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      नियम 4 – Customer Care / ग्राहक सहायता
                    </h4>
                    <p>
                      किसी भी प्रकार की समस्या, Technical Issue या
                      जानकारी की आवश्यकता होने पर ग्राहक Customer Care
                      Team से संपर्क कर सकते हैं। Customer Care Team
                      समस्या को समझकर उचित सहायता और मार्गदर्शन
                      प्रदान करेगी।
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      नियम 5 – Courier/Delivery Charges
                    </h4>
                    <p>
                      Product Order करते समय लागू होने वाला
                      Courier/Delivery Charge ग्राहक को Product Payment
                      के साथ ही भुगतान करना होगा। Courier Charge
                      Delivery Location और लागू Shipping Charges के
                      अनुसार अलग-अलग हो सकता है।
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      नियम 6 – Product Payment एवं Refund Policy
                    </h4>
                    <p>
                      Product के लिए किया गया ₹3,500 का Payment,
                      Product Order Confirm होने के बाद Non-Refundable
                      रहेगा। इसलिए Order Confirm करने से पहले ग्राहक
                      को Product की जानकारी, लागू Charges और कंपनी की
                      Terms & Conditions को ध्यानपूर्वक समझ लेना चाहिए।
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      नियम 7 – CAPTCHA Ratio एवं Work Volume
                    </h4>
                    <p>
                      CAPTCHA Ratio, Daily Work Volume या
                      Words/CAPTCHAs की संख्या System Requirements,
                      Workload और Business Conditions के अनुसार कम या
                      ज्यादा हो सकती है। लागू Work Volume और Ratio
                      कंपनी की Operational Requirements के अनुसार
                      Management द्वारा निर्धारित किया जाएगा। इसमें
                      समय-समय पर परिवर्तन किया जा सकता है।
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      नियम 8 – App की खरीद से पहले जाँच
                    </h4>
                    <p>
                      ग्राहक को Purchase या Registration से पहले App,
                      उसके Features और Work Process को अच्छी तरह देखकर
                      और समझकर पूरी पुष्टि कर लेनी चाहिए। Order Confirm
                      करने से पहले Product Details, Applicable Charges
                      और कंपनी की Terms & Conditions की जाँच करना
                      आवश्यक है।
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      नियम 9 – Free App का उपयोग
                    </h4>
                    <p>
                      कंपनी का App उपयोगकर्ताओं को निःशुल्क (Free of
                      Cost) उपलब्ध कराया जा रहा है। यह कंपनी द्वारा
                      दी गई एक सुविधा है और इसे हमेशा के लिए निःशुल्क
                      रहने की गारंटी नहीं माना जाना चाहिए। कंपनी अपनी
                      Business Requirements के अनुसार भविष्य में App
                      की सुविधाओं या लागू Terms & Conditions में
                      बदलाव कर सकती है।
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                    <h4 className="font-bold text-slate-900">
                      ग्राहक की जिम्मेदारी
                    </h4>

                    <p className="mt-2">
                      App का उपयोग करने या Product Order करने से पहले
                      ग्राहक से अपेक्षा की जाती है कि वह ऊपर दिए गए
                      सभी नियमों, Product Details, Applicable Charges
                      और Terms & Conditions को ध्यानपूर्वक पढ़े और
                      समझे।
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">
                      DIGITAL LYF PVT. LTD.
                    </p>

                    <p className="text-slate-400">
                      कंपनी के नियम एवं शर्तें – लागू नियमों और कंपनी
                      की नीतियों के अधीन
                    </p>
                  </div>
                </div>
              </section>

              <div className="my-8 border-t border-violet-100" />

              {/* English */}
              <section>

                <div className="mb-5">
                  <div className="mb-2 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-600">
                    English
                  </div>

                  <h3 className="text-xl font-black text-slate-900">
                    DIGITAL LYF PVT. LTD.
                  </h3>

                  <p className="mt-1 text-sm font-bold text-violet-600">
                    COMPANY RULES & REGULATIONS
                  </p>
                </div>

                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs leading-6 text-amber-800">
                    <strong>Important Notice:</strong> Customers are
                    requested to carefully read and understand all the
                    following rules and applicable terms before using
                    the App or purchasing the Product.
                  </p>
                </div>

                <div className="space-y-5 text-xs leading-6 text-slate-600">

                  <div>
                    <h4 className="font-bold text-slate-900">
                      Rule 1 – App & Product Charges
                    </h4>
                    <p>
                      The Company's App is being provided to users free
                      of cost. The ₹3,500 amount collected from the
                      customer is not an App fee; it is the charge for
                      the Company's Product/Package. Product/Package
                      details and applicable terms will be clearly
                      communicated to the customer before purchase.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      Rule 2 – App/Software Technical Issues
                    </h4>
                    <p>
                      The Company's App/Software may occasionally
                      experience technical issues, maintenance, or
                      server-related problems. Due to such issues, the
                      App may become slow or may remain temporarily
                      unavailable. The Company will make reasonable
                      efforts to resolve such technical issues within
                      approximately 2 days. Users are requested to
                      cooperate during such situations.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      Rule 3 – Payment Processing
                    </h4>
                    <p>
                      If the scheduled Payment Day falls on a Sunday,
                      Bank Holiday, or Company Holiday, the payment
                      will not be processed on that day. In such
                      circumstances, the payment will be processed on
                      the next working day when the bank/payment system
                      is operational.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      Rule 4 – Customer Care / Customer Support
                    </h4>
                    <p>
                      In case of any issue, technical problem, or
                      requirement for information, customers may
                      contact the Customer Care Team. The Customer Care
                      Team will understand the issue and provide
                      appropriate assistance and guidance.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      Rule 5 – Courier/Delivery Charges
                    </h4>
                    <p>
                      Applicable Courier/Delivery Charges must be paid
                      by the customer along with the Product payment.
                      Courier charges may vary depending on the
                      delivery location and applicable shipping
                      charges.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      Rule 6 – Product Payment & Refund Policy
                    </h4>
                    <p>
                      The ₹3,500 payment made for the Product will be
                      non-refundable once the Product Order has been
                      confirmed. Customers are therefore advised to
                      carefully understand the Product details,
                      applicable charges, and company terms before
                      confirming the order.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      Rule 7 – CAPTCHA Ratio & Work Volume
                    </h4>
                    <p>
                      The CAPTCHA Ratio, daily work volume, or number of
                      words/CAPTCHAs may increase or decrease depending
                      on system requirements, workload, and business
                      conditions. The Company Management will determine
                      the applicable work volume and ratio according to
                      operational requirements. These may be changed
                      from time to time.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      Rule 8 – App Verification Before Purchase
                    </h4>
                    <p>
                      Customers should carefully review and understand
                      the App, its available features, and the work
                      process before purchasing or registering. Before
                      confirming an order, customers should verify the
                      Product details, applicable charges, and the
                      Company's Terms & Conditions.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      Rule 9 – Free App Usage
                    </h4>
                    <p>
                      The Company's App is being provided to users free
                      of cost. This facility is provided as a company
                      service and should not be considered a guarantee
                      that the App will remain free permanently. The
                      Company may modify the App's features or
                      applicable terms in the future according to its
                      business requirements.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                    <h4 className="font-bold text-slate-900">
                      Customer Responsibility
                    </h4>

                    <p className="mt-2">
                      Before using the App or placing a Product Order,
                      customers are expected to carefully read and
                      understand all the above rules, Product details,
                      applicable charges, and Terms & Conditions.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">
                      DIGITAL LYF PVT. LTD.
                    </p>

                    <p className="text-slate-400">
                      Company Rules & Regulations – Subject to
                      applicable terms and company policies
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 flex-col items-center justify-between gap-3 border-t border-violet-100 bg-gradient-to-r from-violet-50/90 via-white to-orange-50/90 px-5 py-4 sm:flex-row sm:px-6">

              <p className="text-center text-[10px] leading-4 text-slate-500 sm:text-left">
                Please make sure you have read and understood the
                applicable Terms & Conditions.
              </p>

              <button
                type="button"
                onClick={handleAgreeTerms}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.98] sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4" />
                I Have Read & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}