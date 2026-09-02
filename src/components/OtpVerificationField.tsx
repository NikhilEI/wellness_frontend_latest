"use client";

import styles from "./OtpVerificationField.module.css";
import type { OtpState } from "@/hooks/useOtpVerification";

interface OtpVerificationFieldProps {
  otp: OtpState;
  verifiedLabel: string;
  sendDisabled: boolean;
  onSend: () => void;
  onVerify: () => void;
  onCodeChange: (value: string) => void;
}

export default function OtpVerificationField({
  otp,
  verifiedLabel,
  sendDisabled,
  onSend,
  onVerify,
  onCodeChange
}: OtpVerificationFieldProps) {
  return (
    <div className={styles.otpBlock}>
      <div className={styles.otpActionsRow}>
        {otp.verified ? (
          <span className={styles.verifiedBadge}>{verifiedLabel}</span>
        ) : (
          <button
            type="button"
            className={styles.btnSecondary}
            disabled={otp.sending || sendDisabled}
            onClick={onSend}
          >
            {otp.sending ? "Sending OTP..." : otp.sent ? "Resend OTP" : "Send OTP"}
          </button>
        )}
      </div>
      {otp.info && !otp.verified && <p className={styles.otpInfo}>{otp.info}</p>}
      {otp.error && <p className={styles.otpError}>{otp.error}</p>}
      {otp.sent && !otp.verified && (
        <div className={styles.otpCodeRow}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className={styles.otpInput}
            placeholder="OTP"
            value={otp.code}
            onChange={(e) => onCodeChange(e.target.value)}
          />
          <button
            type="button"
            className={styles.btnSecondary}
            disabled={otp.verifying || otp.code.length < 4}
            onClick={onVerify}
          >
            {otp.verifying ? "Verifying OTP..." : "Verify OTP"}
          </button>
        </div>
      )}
    </div>
  );
}
