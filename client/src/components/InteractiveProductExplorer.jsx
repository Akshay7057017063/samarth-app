
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

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const ref = searchParams.get("ref");

    if (ref) {
      setFormData((prev) => ({
        ...prev,
        sponsorCode: ref.toUpperCase(),
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!termsAccepted) {
      setError(
        "Please read and accept the Terms & Conditions before registering."
      );
      return;
    }

    setLoading(true);
    setError("");

    const res = await register(formData);

    setLoading(false);

    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.message);
    }
  };

  const handleAgreeTerms = () => {
    setTermsAccepted(true);
    setShowTerms(false);
    setError("");
  };

  return (
    <div className="relative min-h-[90vh] overflow-hidden bg-white py-14 sm:py-20">

      {/* ============================================================
          SUBTLE RAINBOW BACKGROUND
      ============================================================ */}

      <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-violet-100/30 blur-3xl pointer-events-none" />

      <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-pink-100/25 blur-3xl pointer-events-none" />

      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-100/20 blur-3xl pointer-events-none" />

      <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-orange-100/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ============================================================
            PAGE HEADER
        ============================================================ */}

        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold uppercase tracking-wider mb-5">

            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500" />

            <Sparkles className="w-4 h-4 text-violet-600" />

            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent">
              Join Samarth Network
            </span>

          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">

            Create Your{" "}

            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Member Account
            </span>

          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Register your account to access daily CAPTCHA tasks,
            network benefits, and available member features.
          </p>

        </div>

        {/* ============================================================
            REGISTRATION CARD
        ============================================================ */}

        <div className="max-w-5xl mx-auto">

          <div
            className="
              grid grid-cols-1 lg:grid-cols-12
              gap-0
              bg-white
              border border-slate-200
              rounded-3xl
              shadow-[0_20px_60px_rgba(15,23,42,0.08)]
              overflow-hidden
            "
          >

            {/* ========================================================
                LEFT INFORMATION PANEL
            ======================================================== */}

            <div
              className="
                lg:col-span-5
                relative
                bg-gradient-to-br
                from-violet-600
                via-fuchsia-500
                to-orange-500
                p-7 sm:p-9
                text-white
                overflow-hidden
              "
            >

              {/* Decorative Rainbow Glows */}

              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

              <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-cyan-300/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 h-full flex flex-col">

                {/* Logo / Icon */}

                <div
                  className="
                    w-14 h-14
                    rounded-2xl
                    bg-white/15
                    border border-white/25
                    backdrop-blur-md
                    flex items-center justify-center
                    mb-6
                    shadow-lg
                  "
                >
                  <Sparkles className="w-7 h-7 text-white" />
                </div>

                {/* Label */}

                <div
                  className="
                    inline-flex
                    w-fit
                    items-center
                    gap-2
                    px-3 py-1.5
                    rounded-full
                    bg-white/10
                    border border-white/20
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    mb-4
                  "
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Member Registration
                </div>

                <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                  Start Your Journey With Samarth
                </h2>

                <p className="mt-4 text-sm text-white/80 leading-relaxed">
                  Create your account and access the platform's available
                  member features from one simple dashboard.
                </p>

                {/* Benefits */}

                <div className="mt-8 space-y-4">

                  {/* Benefit 1 */}

                  <div className="flex items-start gap-3">

                    <div
                      className="
                        w-9 h-9
                        rounded-xl
                        bg-white/15
                        border border-white/10
                        flex items-center justify-center
                        shrink-0
                      "
                    >
                      <Gift className="w-4 h-4" />
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        ₹50 Welcome Bonus
                      </p>

                      <p className="text-[11px] text-white/70 mt-0.5">
                        Welcome benefit credited according to applicable
                        platform rules.
                      </p>
                    </div>

                  </div>

                  {/* Benefit 2 */}

                  <div className="flex items-start gap-3">

                    <div
                      className="
                        w-9 h-9
                        rounded-xl
                        bg-white/15
                        border border-white/10
                        flex items-center justify-center
                        shrink-0
                      "
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        Daily CAPTCHA Tasks
                      </p>

                      <p className="text-[11px] text-white/70 mt-0.5">
                        Access available CAPTCHA work through your member
                        dashboard.
                      </p>
                    </div>

                  </div>

                  {/* Benefit 3 */}

                  <div className="flex items-start gap-3">

                    <div
                      className="
                        w-9 h-9
                        rounded-xl
                        bg-white/15
                        border border-white/10
                        flex items-center justify-center
                        shrink-0
                      "
                    >
                      <Network className="w-4 h-4" />
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        Referral Network
                      </p>

                      <p className="text-[11px] text-white/70 mt-0.5">
                        Use your referral information according to the
                        applicable company rules.
                      </p>
                    </div>

                  </div>

                </div>

                {/* Bottom Note */}

                <div className="mt-auto pt-8">

                  <div
                    className="
                      rounded-2xl
                      bg-white/10
                      border border-white/15
                      p-4
                      backdrop-blur-md
                    "
                  >
                    <p className="text-[10px] text-white/70 leading-relaxed">
                      By creating an account, you agree to follow the
                      applicable company rules and Terms & Conditions.
                    </p>
                  </div>

                </div>

              </div>
            </div>

            {/* ========================================================
                RIGHT REGISTRATION FORM
            ======================================================== */}

            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10">

              {/* Form Header */}

              <div className="mb-7">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      Create Account
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                      Enter your details to complete registration.
                    </p>

                  </div>

                  <div
                    className="
                      hidden sm:flex
                      w-11 h-11
                      rounded-xl
                      bg-violet-50
                      border border-violet-100
                      items-center justify-center
                    "
                  >
                    <User className="w-5 h-5 text-violet-600" />
                  </div>

                </div>

              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Error */}

                {error && (
                  <div
                    className="
                      p-3.5
                      rounded-xl
                      bg-red-50
                      border border-red-200
                      text-red-600
                      text-xs
                      flex items-center gap-2
                    "
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ====================================================
                    SPONSOR CODE
                ==================================================== */}

                <div
                  className="
                    rounded-2xl
                    bg-gradient-to-r
                    from-violet-50
                    via-fuchsia-50
                    to-orange-50
                    border border-violet-100
                    p-4
                  "
                >

                  <label className="block text-xs font-bold text-violet-700 mb-2">

                    <span className="flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5" />
                      Sponsor / Referral Code
                    </span>

                  </label>

                  <input
                    type="text"
                    value={formData.sponsorCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sponsorCode: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. SAM1001 (Optional)"
                    className="
                      w-full
                      px-3.5 py-2.5
                      rounded-xl
                      bg-white
                      border border-violet-200
                      text-slate-900
                      placeholder:text-slate-400
                      font-mono
                      text-xs
                      focus:outline-none
                      focus:border-violet-500
                      focus:ring-2
                      focus:ring-violet-500/10
                      transition-all
                      uppercase
                    "
                  />

                  <div className="text-[10px] text-slate-500 mt-2">
                    If left empty, you will be placed directly under the
                    root network admin.
                  </div>

                </div>

                {/* ====================================================
                    NAME + PHONE
                ==================================================== */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Name */}

                  <div>

                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name *
                    </label>

                    <div className="relative">

                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Rajesh Kumar"
                        required
                        className="
                          w-full
                          pl-10 pr-3 py-2.5
                          rounded-xl
                          bg-white
                          border border-slate-200
                          text-slate-900
                          placeholder:text-slate-400
                          text-xs
                          focus:outline-none
                          focus:border-violet-500
                          focus:ring-2
                          focus:ring-violet-500/10
                          transition-all
                        "
                      />

                    </div>

                  </div>

                  {/* Phone */}

                  <div>

                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Mobile Phone *
                    </label>

                    <div className="relative">

                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="9876543210"
                        required
                        className="
                          w-full
                          pl-10 pr-3 py-2.5
                          rounded-xl
                          bg-white
                          border border-slate-200
                          text-slate-900
                          placeholder:text-slate-400
                          text-xs
                          focus:outline-none
                          focus:border-violet-500
                          focus:ring-2
                          focus:ring-violet-500/10
                          transition-all
                        "
                      />

                    </div>

                  </div>

                </div>

                {/* ====================================================
                    EMAIL
                ==================================================== */}

                <div>

                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address *
                  </label>

                  <div className="relative">

                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      placeholder="rajesh@example.com"
                      required
                      className="
                        w-full
                        pl-10 pr-3 py-2.5
                        rounded-xl
                        bg-white
                        border border-slate-200
                        text-slate-900
                        placeholder:text-slate-400
                        text-xs
                        focus:outline-none
                        focus:border-violet-500
                        focus:ring-2
                        focus:ring-violet-500/10
                        transition-all
                      "
                    />

                  </div>

                </div>

                {/* ====================================================
                    PASSWORD
                ==================================================== */}

                <div>

                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Create Password *
                  </label>

                  <div className="relative">

                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          password: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                      required
                      className="
                        w-full
                        pl-10 pr-3 py-2.5
                        rounded-xl
                        bg-white
                        border border-slate-200
                        text-slate-900
                        placeholder:text-slate-400
                        text-xs
                        focus:outline-none
                        focus:border-violet-500
                        focus:ring-2
                        focus:ring-violet-500/10
                        transition-all
                      "
                    />

                  </div>

                </div>

                {/* ====================================================
                    TERMS
                ==================================================== */}

                <div
                  className={`
                    rounded-2xl
                    border
                    p-4
                    transition-all
                    ${
                      termsAccepted
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                    }
                  `}
                >

                  <div className="flex items-start gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        setTermsAccepted(!termsAccepted)
                      }
                      className="mt-0.5 shrink-0"
                      aria-label="Accept Terms and Conditions"
                    >
                      {termsAccepted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white hover:border-violet-400 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1">

                      <div className="flex items-center gap-2">

                        <FileText className="w-4 h-4 text-violet-600" />

                        <span className="text-xs font-bold text-slate-900">
                          Terms & Conditions
                        </span>

                      </div>

                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        I have read and understood the Company's Terms &
                        Conditions and agree to follow the applicable
                        rules before using the App or purchasing any
                        Product.
                      </p>

                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="
                          mt-2
                          text-[11px]
                          font-bold
                          text-violet-600
                          hover:text-fuchsia-600
                          underline
                          underline-offset-2
                          transition-colors
                        "
                      >
                        Read More
                      </button>

                      {termsAccepted && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Terms & Conditions accepted
                        </div>
                      )}

                    </div>

                  </div>

                  {!termsAccepted && (
                    <div className="mt-3 text-[10px] text-amber-600">
                      Please accept the Terms & Conditions to continue.
                    </div>
                  )}

                </div>

                {/* ====================================================
                    SUBMIT
                ==================================================== */}

                <button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className="
                    w-full
                    mt-2
                    py-3.5
                    px-4
                    rounded-xl
                    font-bold
                    text-xs
                    uppercase
                    tracking-wider
                    bg-gradient-to-r
                    from-violet-600
                    via-fuchsia-500
                    to-orange-500
                    text-white
                    shadow-lg
                    shadow-violet-500/20
                    hover:shadow-xl
                    hover:shadow-fuchsia-500/20
                    hover:scale-[1.01]
                    active:scale-[0.99]
                    transition-all
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    disabled:hover:scale-100
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >

                  {loading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>
                        Complete Registration & Claim ₹50
                      </span>

                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}

                </button>

              </form>

              {/* Login */}

              <div className="mt-6 text-center text-xs text-slate-500">

                Already registered?{" "}

                <Link
                  to="/login"
                  className="
                    bg-gradient-to-r
                    from-violet-600
                    via-fuchsia-500
                    to-orange-500
                    bg-clip-text
                    text-transparent
                    font-bold
                    transition-opacity
                    hover:opacity-80
                  "
                >
                  Sign In Here
                </Link>

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          TERMS & CONDITIONS MODAL
      ============================================================== */}

      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">

          <div
            className="
              w-full
              max-w-4xl
              max-h-[90vh]
              bg-white
              border border-slate-200
              rounded-3xl
              shadow-2xl
              overflow-hidden
              flex flex-col
            "
          >

            {/* Modal Header */}

            <div
              className="
                flex items-center justify-between gap-4
                px-6 py-5
                border-b border-slate-200
                bg-white
                shrink-0
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    w-10 h-10
                    rounded-xl
                    bg-gradient-to-r
                    from-violet-600
                    via-fuchsia-500
                    to-orange-500
                    flex items-center justify-center
                  "
                >
                  <FileText className="w-4 h-4 text-white" />
                </div>

                <div>

                  <h2 className="text-lg font-black text-slate-900">
                    Terms & Conditions
                  </h2>

                  <p className="text-[10px] text-slate-500 mt-0.5">
                    DIGITAL LYF PVT. LTD.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="
                  w-9 h-9
                  rounded-xl
                  bg-white
                  border border-slate-200
                  hover:bg-slate-50
                  hover:border-slate-300
                  flex items-center justify-center
                  text-slate-500
                  hover:text-slate-800
                  transition-all
                "
                aria-label="Close Terms"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {/* Terms Content */}

            <div className="overflow-y-auto px-5 sm:px-8 py-7 space-y-8">

              {/* Hindi Section */}

              <section>

                <div className="mb-5">

                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-3 py-1.5
                      rounded-full
                      bg-violet-50
                      border border-violet-100
                      text-violet-600
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wider
                    "
                  >
                    हिंदी
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mt-3">
                    DIGITAL LYF PVT. LTD.
                  </h3>

                  <p className="text-sm font-bold text-violet-600 mt-1">
                    कंपनी के नियम एवं शर्तें
                  </p>

                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 mb-6">

                  <p className="text-xs text-amber-800 leading-6">
                    <strong>महत्वपूर्ण सूचना:</strong> App का उपयोग या
                    Product खरीदने से पहले ग्राहक नीचे दिए गए सभी नियमों
                    एवं लागू शर्तों को ध्यानपूर्वक पढ़कर और समझकर ही
                    आगे बढ़ें।
                  </p>

                </div>

                <div className="space-y-5 text-xs text-slate-600 leading-6">

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

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">

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

                    <p className="text-slate-500">
                      कंपनी के नियम एवं शर्तें – लागू नियमों और कंपनी
                      की नीतियों के अधीन
                    </p>

                  </div>

                </div>
              </section>

              {/* Divider */}

              <div className="border-t border-slate-200" />

              {/* English Section */}

              <section>

                <div className="mb-5">

                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-3 py-1.5
                      rounded-full
                      bg-orange-50
                      border border-orange-100
                      text-orange-600
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wider
                    "
                  >
                    English
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mt-3">
                    DIGITAL LYF PVT. LTD.
                  </h3>

                  <p className="text-sm font-bold text-violet-600 mt-1">
                    COMPANY RULES & REGULATIONS
                  </p>

                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 mb-6">

                  <p className="text-xs text-amber-800 leading-6">
                    <strong>Important Notice:</strong> Customers are
                    requested to carefully read and understand all the
                    following rules and applicable terms before using
                    the App or purchasing the Product.
                  </p>

                </div>

                <div className="space-y-5 text-xs text-slate-600 leading-6">

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

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">

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

                    <p className="text-slate-500">
                      Company Rules & Regulations – Subject to
                      applicable terms and company policies
                    </p>

                  </div>

                </div>
              </section>

            </div>

            {/* Modal Footer */}

            <div
              className="
                px-6 py-4
                border-t border-slate-200
                bg-white
                flex flex-col sm:flex-row
                items-center justify-between
                gap-3
                shrink-0
              "
            >

              <p className="text-[10px] text-slate-500 text-center sm:text-left">
                Please make sure you have read and understood the
                applicable Terms & Conditions.
              </p>

              <button
                type="button"
                onClick={handleAgreeTerms}
                className="
                  w-full sm:w-auto
                  px-6 py-3
                  rounded-xl
                  bg-gradient-to-r
                  from-violet-600
                  via-fuchsia-500
                  to-orange-500
                  text-white
                  text-xs
                  font-bold
                  shadow-lg
                  shadow-violet-500/20
                  hover:shadow-xl
                  hover:shadow-fuchsia-500/20
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  transition-all
                  flex items-center
                  justify-center
                  gap-2
                "
              >
                <CheckCircle2 className="w-4 h-4" />
                I Have Read & Agree
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
