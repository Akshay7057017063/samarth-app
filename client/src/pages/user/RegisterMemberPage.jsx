import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import MemberRegisterForm from "../../components/MemberRegisterForm";

// =====================================================
// /dashboard/register
// Protected customer registration page
// =====================================================

export default function RegisterMemberPage() {
  const {
    user,
    registerMember,
  } = useAuth();

  // Sponsor is always the currently logged-in customer.
  const sponsorMemberId =
    user?.memberId ||
    user?.userCode ||
    "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* =================================================
          BACK TO DASHBOARD
          ================================================= */}

      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-violet-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      {/* =================================================
          PAGE TITLE
          ================================================= */}

      <h1 className="text-2xl font-black text-slate-900">
        New Member Registration
      </h1>

      <p className="mb-5 mt-1 text-xs leading-5 text-slate-500">
        Register a new member under your account.
        The new member will remain inactive until
        the activation PIN sent by admin is verified.
      </p>

      {/* =================================================
          REGISTRATION FORM
          ================================================= */}

      <MemberRegisterForm
        sponsorMemberId={sponsorMemberId}
        sponsorName={user?.name || ""}
        defaultPosition="left"
        onSubmit={registerMember}
      />
    </div>
  );
}