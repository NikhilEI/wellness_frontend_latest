"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010/api";

// Mirrors the backend's default OTP_RESEND_COOLDOWN_SECONDS (see otpStore.js) so the
// button's countdown lines up with when a resend will actually be accepted.
const RESEND_COOLDOWN_SECONDS = 120;

export class OtpApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function postJson(url: string, data: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new OtpApiError(body.message || "Something went wrong. Please try again.", res.status);
  }
  return body;
}

export interface OtpState {
  sent: boolean;
  code: string;
  verified: boolean;
  sending: boolean;
  verifying: boolean;
  error: string;
  info: string;
  resendCooldown: number;
}

const initialOtpState: OtpState = {
  sent: false,
  code: "",
  verified: false,
  sending: false,
  verifying: false,
  error: "",
  info: "",
  resendCooldown: 0
};

export type OtpIdentifier =
  | { channel: "mobile"; mobile: string; countryCode: string }
  | { channel: "email"; email: string }
  | { channel: "both"; mobile: string; countryCode: string; email: string };

// Drives one OTP channel (a mobile number or an email address) against the shared
// /api/otp/send + /api/otp/verify endpoints. Each form supplies its own identifier
// (built from its own form state) when calling send()/verify().
export function useOtpVerification() {
  const [state, setState] = useState<OtpState>(initialOtpState);

  // Ticks the resend countdown down to 0 once a second. Re-armed only when the
  // cooldown transitions between zero and non-zero, not on every tick.
  useEffect(() => {
    if (state.resendCooldown <= 0) return undefined;
    const id = setInterval(() => {
      setState((prev) => ({ ...prev, resendCooldown: Math.max(0, prev.resendCooldown - 1) }));
    }, 1000);
    return () => clearInterval(id);
  }, [state.resendCooldown > 0]);

  function reset() {
    setState(initialOtpState);
  }

  function setCode(value: string) {
    setState((prev) => ({ ...prev, code: value.replace(/[^0-9]/g, "").slice(0, 6) }));
  }

  async function send(identifier: OtpIdentifier) {
    setState((prev) => ({ ...prev, sending: true, error: "" }));
    try {
      const body = await postJson(`${API_BASE}/otp/send`, identifier);
      const info =
        identifier.channel === "both"
          ? body.message || "OTP sent successfully via Email and WhatsApp."
          : `OTP sent. It's valid for ${Math.round((body.expiresInSeconds || 600) / 60)} minutes.`;
      setState((prev) => ({
        ...prev,
        sending: false,
        sent: true,
        info,
        resendCooldown: RESEND_COOLDOWN_SECONDS
      }));
      return true;
    } catch (err) {
      const message = err instanceof OtpApiError ? err.message : "Could not send OTP. Please try again.";
      setState((prev) => ({ ...prev, sending: false, error: message }));
      return false;
    }
  }

  async function verify(identifier: OtpIdentifier, code: string) {
    setState((prev) => ({ ...prev, verifying: true, error: "" }));
    try {
      await postJson(`${API_BASE}/otp/verify`, { ...identifier, otp: code });
      setState((prev) => ({ ...prev, verifying: false, verified: true, info: "Verified successfully.", error: "" }));
      return true;
    } catch (err) {
      const message = err instanceof OtpApiError ? err.message : "Invalid or expired OTP.";
      setState((prev) => ({ ...prev, verifying: false, error: message }));
      return false;
    }
  }

  return { state, send, verify, reset, setCode };
}
