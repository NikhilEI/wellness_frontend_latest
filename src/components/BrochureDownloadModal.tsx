"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./BrochureDownloadModal.module.css";
import { countries, findCountry } from "@/data/countries";
import { brochureInterestOptions } from "@/data/brochureFormOptions";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010/api";
const BROCHURE_URL = "/pdf/Wellness-India-2027-Expo-Brochure.pdf";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{6,15}$/;

declare global {
  interface Window {
    openBrochureModal?: () => void;
  }
}

interface FormState {
  fullName: string;
  designation: string;
  companyName: string;
  industry: string;
  interest: string;
  email: string;
  country: string;
  countryCode: string;
  mobile: string;
}

const initialForm: FormState = {
  fullName: "",
  designation: "",
  companyName: "",
  industry: "",
  interest: "",
  email: "",
  country: "India",
  countryCode: "+91",
  mobile: ""
};

class ApiError extends Error {
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
    throw new ApiError(body.message || "Something went wrong. Please try again.", res.status);
  }
  return body;
}

export default function BrochureDownloadModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpInfo, setOtpInfo] = useState("");
  const [otpError, setOtpError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [apiError, setApiError] = useState("");
  const downloadRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    window.openBrochureModal = () => setOpen(true);
    return () => {
      delete window.openBrochureModal;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (status === "success") {
      downloadRef.current?.click();
    }
  }, [status]);

  function close() {
    setOpen(false);
    setForm(initialForm);
    setErrors({});
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode("");
    setOtpInfo("");
    setOtpError("");
    setStatus("idle");
    setApiError("");
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleCountryChange(name: string) {
    const country = findCountry(name);
    setField("country", name);
    setForm((prev) => ({ ...prev, countryCode: country?.dialCode || "" }));
  }

  function handleMobileChange(value: string) {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 15);
    setField("mobile", digits);
    if (otpSent) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode("");
      setOtpInfo("");
      setOtpError("");
    }
  }

  async function sendOtp() {
    if (!form.countryCode || !MOBILE_RE.test(form.mobile)) {
      setErrors((prev) => ({ ...prev, mobile: "Please enter a valid mobile number." }));
      return;
    }

    setOtpSending(true);
    setOtpError("");

    try {
      const body = await postJson(`${API_BASE}/otp/send`, {
        channel: "mobile",
        mobile: form.mobile,
        countryCode: form.countryCode
      });
      setOtpSending(false);
      setOtpSent(true);
      setOtpInfo(
        `OTP sent. It's valid for ${Math.round((body.expiresInSeconds || 600) / 60)} minutes. (Demo mode — OTP is 1234 until the SMS gateway is live.)`
      );
    } catch (err) {
      setOtpSending(false);
      setOtpError(err instanceof ApiError ? err.message : "Could not send OTP. Please try again.");
    }
  }

  async function verifyOtp() {
    setOtpVerifying(true);
    setOtpError("");

    try {
      await postJson(`${API_BASE}/otp/verify`, {
        channel: "mobile",
        mobile: form.mobile,
        countryCode: form.countryCode,
        otp: otpCode
      });
      setOtpVerifying(false);
      setOtpVerified(true);
      setOtpInfo("Mobile number verified.");
      setOtpError("");
    } catch (err) {
      setOtpVerifying(false);
      setOtpError(err instanceof ApiError ? err.message : "Invalid or expired OTP.");
    }
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};

    if (form.fullName.trim().length < 2 || form.fullName.trim().length > 100) {
      next.fullName = "Please enter your full name.";
    }
    if (form.designation.trim().length < 2 || form.designation.trim().length > 100) {
      next.designation = "Please enter your designation.";
    }
    if (form.companyName.trim().length < 2 || form.companyName.trim().length > 150) {
      next.companyName = "Please enter your company name.";
    }
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Please enter a valid email address.";
    if (!form.country) next.country = "Please select a country.";
    if (!form.countryCode || !MOBILE_RE.test(form.mobile)) {
      next.mobile = "Enter 6 to 15 digits, no country code.";
    }

    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");

    const validationErrors = validate();
    if (!otpVerified) validationErrors.otp = "Please verify your mobile number via OTP before submitting.";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus("submitting");

    try {
      await postJson(`${API_BASE}/brochure-download`, {
        fullName: form.fullName.trim(),
        designation: form.designation.trim(),
        companyName: form.companyName.trim(),
        industry: form.industry.trim(),
        interest: form.interest,
        email: form.email.trim().toLowerCase(),
        country: form.country,
        countryCode: form.countryCode,
        mobile: form.mobile
      });
      setStatus("success");
    } catch (err) {
      setStatus("idle");
      setApiError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={close}>
      <div
        className={styles.box}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="brochure-modal-title"
      >
        <button type="button" className={styles.closeBtn} onClick={close} aria-label="Close">
          &times;
        </button>

        {status === "success" ? (
          <div className={styles.successWrap}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Thank You!</h2>
            <p className={styles.successText}>
              Thanks for your interest in Wellness India Expo 2027. Your brochure download has started
              automatically — a copy has also been emailed to you.
            </p>
            <a
              ref={downloadRef}
              href={BROCHURE_URL}
              target="_blank"
              rel="noopener noreferrer"
              download
              className={styles.downloadBtn}
            >
              Download Brochure
            </a>
          </div>
        ) : (
          <>
            <h2 id="brochure-modal-title" className={styles.title}>
              Download Brochure
            </h2>
            <p className={styles.subtitle}>Share your details to download the Wellness India Expo 2027 brochure.</p>

            {apiError && (
              <div className={styles.apiError} role="alert">
                {apiError}
              </div>
            )}

            <form noValidate onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="brochure-fullName">
                  Full Name <span className={styles.starMark}>*</span>
                </label>
                <input
                  id="brochure-fullName"
                  type="text"
                  maxLength={100}
                  className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  aria-invalid={Boolean(errors.fullName)}
                />
                {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="brochure-designation">
                  Designation <span className={styles.starMark}>*</span>
                </label>
                <input
                  id="brochure-designation"
                  type="text"
                  maxLength={100}
                  className={`${styles.input} ${errors.designation ? styles.inputError : ""}`}
                  value={form.designation}
                  onChange={(e) => setField("designation", e.target.value)}
                  aria-invalid={Boolean(errors.designation)}
                />
                {errors.designation && <span className={styles.errorText}>{errors.designation}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="brochure-companyName">
                  Company Name <span className={styles.starMark}>*</span>
                </label>
                <input
                  id="brochure-companyName"
                  type="text"
                  maxLength={150}
                  className={`${styles.input} ${errors.companyName ? styles.inputError : ""}`}
                  value={form.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                  aria-invalid={Boolean(errors.companyName)}
                />
                {errors.companyName && <span className={styles.errorText}>{errors.companyName}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="brochure-industry">
                  Industry / Sector
                </label>
                <input
                  id="brochure-industry"
                  type="text"
                  maxLength={150}
                  className={styles.input}
                  value={form.industry}
                  onChange={(e) => setField("industry", e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="brochure-interest">
                  Please specify your interest
                </label>
                <select
                  id="brochure-interest"
                  className={styles.select}
                  value={form.interest}
                  onChange={(e) => setField("interest", e.target.value)}
                >
                  <option value="">Select an option</option>
                  {brochureInterestOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="brochure-email">
                  Email address <span className={styles.starMark}>*</span>
                </label>
                <input
                  id="brochure-email"
                  type="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="brochure-country">
                  Country <span className={styles.starMark}>*</span>
                </label>
                <select
                  id="brochure-country"
                  className={`${styles.select} ${errors.country ? styles.inputError : ""}`}
                  value={form.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  aria-invalid={Boolean(errors.country)}
                >
                  <option value="">Choose a Country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name} ({c.dialCode})
                    </option>
                  ))}
                </select>
                {errors.country && <span className={styles.errorText}>{errors.country}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="brochure-mobile">
                  Mobile number <span className={styles.starMark}>*</span>
                </label>
                <div className={styles.mobileRow}>
                  <span className={styles.dialCode}>{form.countryCode || "—"}</span>
                  <input
                    id="brochure-mobile"
                    type="tel"
                    inputMode="numeric"
                    className={`${styles.input} ${errors.mobile ? styles.inputError : ""}`}
                    value={form.mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    aria-invalid={Boolean(errors.mobile)}
                  />
                </div>
                <p className={styles.helpText}>Enter 6 to 15 digits, no country code.</p>
                {errors.mobile && <span className={styles.errorText}>{errors.mobile}</span>}

                <div className={styles.otpBlock}>
                  <div className={styles.otpActionsRow}>
                    {otpVerified ? (
                      <span className={styles.verifiedBadge}>Mobile number verified</span>
                    ) : (
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        disabled={otpSending || !form.countryCode || !form.mobile}
                        onClick={sendOtp}
                      >
                        {otpSending ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
                      </button>
                    )}
                  </div>
                  {otpInfo && !otpVerified && <p className={styles.otpInfo}>{otpInfo}</p>}
                  {otpError && <p className={styles.otpError}>{otpError}</p>}
                  {otpSent && !otpVerified && (
                    <div className={styles.otpCodeRow}>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className={styles.otpInput}
                        placeholder="Enter OTP"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                      />
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        disabled={otpVerifying || otpCode.length < 4}
                        onClick={verifyOtp}
                      >
                        {otpVerifying ? "Verifying..." : "Verify OTP"}
                      </button>
                    </div>
                  )}
                </div>
                {errors.otp && (
                  <span className={styles.errorText} role="alert">
                    {errors.otp}
                  </span>
                )}
              </div>

              <button type="submit" className={styles.submitBtn} disabled={status === "submitting"}>
                {status === "submitting" ? "Submitting..." : "Get Brochure"}
              </button>
              <div className={styles.mandatoryNote}>
                <span className={styles.starMark}>*</span> Mandatory fields
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
