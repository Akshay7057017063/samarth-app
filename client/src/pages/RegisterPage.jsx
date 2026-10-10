import React from "react";
import { Link, Navigate } from "react-router-dom";

export default function RegisterPage() {
  return (
    <Navigate
      to="/login"
      replace
      state={{
        message:
          "Public registration is disabled. Existing members can register new members from their dashboard.",
      }}
    />
  );
}