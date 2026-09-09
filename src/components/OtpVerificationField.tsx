"use client";

import { useId } from "react";
import styles from "./OtpVerificationField.module.css";
import type { OtpState } from "@/hooks/useOtpVerification";

interface OtpSendButtonProps {
  otp: OtpState;
  sendDisabled: boolean;
  onSend: () => void;
}

// Meant to sit right next to the mobile/email input (same row) so sending the
// OTP reads as one action on that field instead of a separate control below it.
export function OtpSendButton({ otp, sendDisabled, onSend }: OtpSendButtonProps) {
  if (otp.verified) {
    return <span className={styles.verifiedBadgeInline}>Verified</span>;
  }
  const onCooldown = otp.sent && otp.resendCooldown > 0;
  return (
    <button
      type="button"
      className={styles.sendOtpBtn}
      disabled={otp.sending || sendDisabled || onCooldown}
      onClick={onSend}
    >
      {otp.sending ? "Sending..." : onCooldown ? `Resend ${otp.resendCooldown}s` : otp.sent ? "Resend OTP" : "Send OTP"}
    </button>
  );
}

interface OtpVerificationFieldProps {
  otp: OtpState;
  onVerify: () => void;
  onCodeChange: (value: string) => void;
}

export default function OtpVerificationField({ otp, onVerify, onCodeChange }: OtpVerificationFieldProps) {
  const codeInputId = useId();

  const hasContent = otp.error || (otp.sent && !otp.verified);
  if (!hasContent) return null;

  return (
    <div className={styles.otpBlock}>
      {otp.info && !otp.verified && <p className={styles.otpInfo}>{otp.info}</p>}
      {otp.error && <p className={styles.otpError}>{otp.error}</p>}
      {otp.sent && !otp.verified && (
        <div className={styles.otpCodeRow}>
          <label className={styles.otpLabel} htmlFor={codeInputId}>
            Enter OTP
          </label>
          <input
            id={codeInputId}
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            className={styles.otpInput}
            placeholder="• • • • • •"
            value={otp.code}
            onChange={(e) => onCodeChange(e.target.value)}
          />
          <button
            type="button"
            className={styles.btnVerify}
            disabled={otp.verifying || otp.code.length < 4}
            onClick={onVerify}
          >
            {otp.verifying ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      )}
    </div>
  );
}
