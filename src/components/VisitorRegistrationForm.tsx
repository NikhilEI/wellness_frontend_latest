"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./VisitorRegistrationForm.module.css";
import { countries, findCountry } from "@/data/countries";
import { statesForCountry } from "@/data/indiaStates";
import {
  titles,
  designations,
  visitObjectives,
  productInterestOptions
} from "@/data/visitorRegistrationOptions";
import { eventEligibility } from "@/lib/eventEligibility";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010/api";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-z][A-Za-z\s'-]{1,99}$/;

type OtpChannel = "mobile" | "email";

interface FormState {
  title: string;
  firstName: string;
  lastName: string;
  organisation: string;
  designation: string;
  department: string;
  country: string;
  countryCode: string;
  state: string;
  city: string;
  mobile: string;
  email: string;
  visitObjective: string;
  productInterests: string[];
  termsAccepted: boolean;
  marketingConsent: boolean;
}

interface OtpChannelState {
  sent: boolean;
  code: string;
  verified: boolean;
  sending: boolean;
  verifying: boolean;
  error: string;
  info: string;
}

const initialForm: FormState = {
  title: "",
  firstName: "",
  lastName: "",
  organisation: "",
  designation: "",
  department: "",
  country: "",
  countryCode: "",
  state: "",
  city: "",
  mobile: "",
  email: "",
  visitObjective: "",
  productInterests: [],
  termsAccepted: false,
  marketingConsent: false
};

const initialOtpChannel: OtpChannelState = {
  sent: false,
  code: "",
  verified: false,
  sending: false,
  verifying: false,
  error: "",
  info: ""
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

export default function VisitorRegistrationForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState<Record<OtpChannel, OtpChannelState>>({
    mobile: { ...initialOtpChannel },
    email: { ...initialOtpChannel }
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [apiError, setApiError] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);

  const selectedCountry = findCountry(form.country);
  const stateOptions = selectedCountry ? statesForCountry(selectedCountry.code) : [];
  const isOtpVerified = otp.mobile.verified || otp.email.verified;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function resetOtpChannel(channel: OtpChannel) {
    setOtp((prev) => ({ ...prev, [channel]: { ...initialOtpChannel } }));
  }

  function handleCountryChange(name: string) {
    const country = findCountry(name);
    setForm((prev) => ({
      ...prev,
      country: name,
      countryCode: country?.dialCode || "",
      state: "",
      city: prev.city
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.country;
      delete next.state;
      return next;
    });
  }

  function handleMobileChange(value: string) {
    const digits = value.replace(/[^0-9]/g, "").slice(0, selectedCountry?.phoneLength.max || 15);
    setField("mobile", digits);
    if (otp.mobile.sent) resetOtpChannel("mobile");
  }

  function handleEmailChange(value: string) {
    setField("email", value);
    if (otp.email.sent) resetOtpChannel("email");
  }

  function toggleProductInterest(option: string) {
    setForm((prev) => {
      const has = prev.productInterests.includes(option);
      return {
        ...prev,
        productInterests: has
          ? prev.productInterests.filter((v) => v !== option)
          : [...prev.productInterests, option]
      };
    });
    setErrors((prev) => {
      if (!prev.productInterests) return prev;
      const next = { ...prev };
      delete next.productInterests;
      return next;
    });
  }

  async function sendOtp(channel: OtpChannel) {
    if (channel === "mobile") {
      if (!selectedCountry) {
        setErrors((prev) => ({ ...prev, country: "Please select a country first." }));
        return;
      }
      const { min, max } = selectedCountry.phoneLength;
      if (form.mobile.length < min || form.mobile.length > max) {
        setErrors((prev) => ({ ...prev, mobile: "Please enter a valid mobile number." }));
        return;
      }
    } else if (!EMAIL_RE.test(form.email.trim())) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
      return;
    }

    setOtp((prev) => ({ ...prev, [channel]: { ...prev[channel], sending: true, error: "" } }));

    try {
      const body = await postJson(`${API_BASE}/otp/send`, {
        channel,
        mobile: form.mobile,
        countryCode: form.countryCode,
        email: form.email.trim().toLowerCase()
      });
      setOtp((prev) => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          sending: false,
          sent: true,
          info: `OTP sent. It's valid for ${Math.round((body.expiresInSeconds || 600) / 60)} minutes. (Demo mode — OTP is 1234 until the SMS/email gateway is live.)`
        }
      }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not send OTP. Please try again.";
      setOtp((prev) => ({ ...prev, [channel]: { ...prev[channel], sending: false, error: message } }));
    }
  }

  async function verifyOtp(channel: OtpChannel) {
    setOtp((prev) => ({ ...prev, [channel]: { ...prev[channel], verifying: true, error: "" } }));

    try {
      await postJson(`${API_BASE}/otp/verify`, {
        channel,
        mobile: form.mobile,
        countryCode: form.countryCode,
        email: form.email.trim().toLowerCase(),
        otp: otp[channel].code
      });
      setOtp((prev) => ({
        ...prev,
        [channel]: { ...prev[channel], verifying: false, verified: true, info: "Verified successfully.", error: "" }
      }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Invalid or expired OTP.";
      setOtp((prev) => ({ ...prev, [channel]: { ...prev[channel], verifying: false, error: message } }));
    }
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};

    if (!titles.includes(form.title as (typeof titles)[number])) next.title = "Please select a title.";
    if (!NAME_RE.test(form.firstName.trim())) next.firstName = "First name must be 2-100 letters, no numbers.";
    if (!NAME_RE.test(form.lastName.trim())) next.lastName = "Last name must be 2-100 letters, no numbers.";
    if (form.organisation.length > 150) next.organisation = "Organisation must be under 150 characters.";
    if (!designations.includes(form.designation as (typeof designations)[number])) {
      next.designation = "Please select a designation.";
    }
    if (!form.country) next.country = "Please select a country.";
    if (!form.state.trim()) next.state = "Please select or enter a state.";
    if (form.city.trim().length < 2 || form.city.trim().length > 100) {
      next.city = "City must be between 2 and 100 characters.";
    }
    if (selectedCountry) {
      const { min, max } = selectedCountry.phoneLength;
      if (form.mobile.length < min || form.mobile.length > max) {
        next.mobile = "Please enter a valid mobile number.";
      }
    } else {
      next.mobile = "Please select a country first.";
    }
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Please enter a valid email address.";
    if (!visitObjectives.includes(form.visitObjective as (typeof visitObjectives)[number])) {
      next.visitObjective = "Please select the objective of your visit.";
    }
    if (form.productInterests.length === 0) next.productInterests = "Please select at least one product interest.";
    if (!form.termsAccepted) {
      next.termsAccepted = "Please confirm that you are 18 years of age or older and accept the Terms & Conditions.";
    }

    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");

    const validationErrors = validate();
    if (!isOtpVerified) {
      validationErrors.otp = "Please verify your mobile number or email address via OTP before submitting.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus("submitting");

    try {
      const payload = {
        title: form.title,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        organisation: form.organisation.trim(),
        designation: form.designation,
        department: form.department.trim(),
        country: form.country,
        countryCode: form.countryCode,
        state: form.state,
        city: form.city.trim(),
        mobile: form.mobile,
        email: form.email.trim().toLowerCase(),
        otpVerified: isOtpVerified,
        visitObjective: form.visitObjective,
        productInterests: form.productInterests,
        termsAccepted: form.termsAccepted,
        marketingConsent: form.marketingConsent
      };

      const body = await postJson(`${API_BASE}/visitor-registration`, payload);
      setRegistrationId(body.registrationId || "");
      setStatus("success");
    } catch (err) {
      setStatus("idle");
      if (err instanceof ApiError && err.status === 409) {
        setApiError(err.message);
      } else {
        setApiError(err instanceof Error ? err.message : "Something went wrong while completing your registration. Please try again.");
      }
    }
  }

  if (status === "success") {
    return (
      <div className={styles.successWrap}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.successTitle}>Registration Successful!</h2>
        <p className={styles.successText}>
          Thank you for registering as a visitor. Your registration has been successfully submitted.
        </p>
        <div className={styles.regIdBox}>{registrationId || "WIE-XXXXXXXX"}</div>
        <p className={styles.successText}>Please keep this registration ID for future reference.</p>
        <Link href="/" className={styles.backHomeBtn}>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.formWrap}>
      <form noValidate onSubmit={handleSubmit}>
        {apiError && (
          <div className={styles.apiError} role="alert">
            {apiError}
          </div>
        )}

        <h3 className={styles.sectionTitle}>Personal Information</h3>
        <div className="row">
          <div className="col-md-4 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="title">
                Title <span className={styles.starMark}>*</span>
              </label>
              <select
                id="title"
                className={`${styles.select} ${errors.title ? styles.inputError : ""}`}
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                aria-describedby={errors.title ? "title-error" : undefined}
                aria-invalid={Boolean(errors.title)}
              >
                <option value="">Select</option>
                {titles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.title && (
                <span id="title-error" className={styles.errorText}>
                  {errors.title}
                </span>
              )}
            </div>
          </div>
          <div className="col-md-4 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="firstName">
                First Name <span className={styles.starMark}>*</span>
              </label>
              <input
                id="firstName"
                type="text"
                maxLength={100}
                className={`${styles.input} ${errors.firstName ? styles.inputError : ""}`}
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
                aria-invalid={Boolean(errors.firstName)}
              />
              {errors.firstName && (
                <span id="firstName-error" className={styles.errorText}>
                  {errors.firstName}
                </span>
              )}
            </div>
          </div>
          <div className="col-md-4 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lastName">
                Last Name <span className={styles.starMark}>*</span>
              </label>
              <input
                id="lastName"
                type="text"
                maxLength={100}
                className={`${styles.input} ${errors.lastName ? styles.inputError : ""}`}
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
                aria-invalid={Boolean(errors.lastName)}
              />
              {errors.lastName && (
                <span id="lastName-error" className={styles.errorText}>
                  {errors.lastName}
                </span>
              )}
            </div>
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Professional Information</h3>
        <div className="row">
          <div className="col-md-6 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="organisation">
                Organisation
              </label>
              <input
                id="organisation"
                type="text"
                maxLength={150}
                className={`${styles.input} ${errors.organisation ? styles.inputError : ""}`}
                value={form.organisation}
                onChange={(e) => setField("organisation", e.target.value)}
              />
              {errors.organisation && <span className={styles.errorText}>{errors.organisation}</span>}
            </div>
          </div>
          <div className="col-md-6 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="designation">
                Designation <span className={styles.starMark}>*</span>
              </label>
              <select
                id="designation"
                className={`${styles.select} ${errors.designation ? styles.inputError : ""}`}
                value={form.designation}
                onChange={(e) => setField("designation", e.target.value)}
                aria-describedby={errors.designation ? "designation-error" : undefined}
                aria-invalid={Boolean(errors.designation)}
              >
                <option value="">Select Designation</option>
                {designations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.designation && (
                <span id="designation-error" className={styles.errorText}>
                  {errors.designation}
                </span>
              )}
              {form.designation === "Student" && (
                <div className={styles.infoBanner} role="status">
                  {eventEligibility.studentMessage}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="department">
                Department
              </label>
              <input
                id="department"
                type="text"
                className={styles.input}
                value={form.department}
                onChange={(e) => setField("department", e.target.value)}
                placeholder="e.g. IT, Marketing, Sales"
              />
            </div>
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Location Information</h3>
        <div className="row">
          <div className="col-md-6 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="country">
                Country <span className={styles.starMark}>*</span>
              </label>
              <select
                id="country"
                className={`${styles.select} ${errors.country ? styles.inputError : ""}`}
                value={form.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                aria-describedby={errors.country ? "country-error" : undefined}
                aria-invalid={Boolean(errors.country)}
              >
                <option value="">Choose a Country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
              {errors.country && (
                <span id="country-error" className={styles.errorText}>
                  {errors.country}
                </span>
              )}
            </div>
          </div>
          <div className="col-md-6 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="state">
                State <span className={styles.starMark}>*</span>
              </label>
              {stateOptions.length > 0 ? (
                <select
                  id="state"
                  className={`${styles.select} ${errors.state ? styles.inputError : ""}`}
                  value={form.state}
                  onChange={(e) => setField("state", e.target.value)}
                  aria-describedby={errors.state ? "state-error" : undefined}
                  aria-invalid={Boolean(errors.state)}
                >
                  <option value="">Select State</option>
                  {stateOptions.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="state"
                  type="text"
                  maxLength={100}
                  className={`${styles.input} ${errors.state ? styles.inputError : ""}`}
                  value={form.state}
                  onChange={(e) => setField("state", e.target.value)}
                  placeholder={form.country ? "Enter your state / province" : "Select a country first"}
                  disabled={!form.country}
                  aria-describedby={errors.state ? "state-error" : undefined}
                  aria-invalid={Boolean(errors.state)}
                />
              )}
              {errors.state && (
                <span id="state-error" className={styles.errorText}>
                  {errors.state}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="city">
                City <span className={styles.starMark}>*</span>
              </label>
              <input
                id="city"
                type="text"
                maxLength={100}
                className={`${styles.input} ${errors.city ? styles.inputError : ""}`}
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                aria-describedby={errors.city ? "city-error" : undefined}
                aria-invalid={Boolean(errors.city)}
              />
              {errors.city && (
                <span id="city-error" className={styles.errorText}>
                  {errors.city}
                </span>
              )}
            </div>
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Contact Information &amp; Verification</h3>
        <div className="row">
          <div className="col-md-6 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="mobile">
                Mobile Number <span className={styles.starMark}>*</span>
              </label>
              <div className={styles.mobileRow}>
                <span className={styles.dialCode}>{form.countryCode || "—"}</span>
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  className={`${styles.input} ${errors.mobile ? styles.inputError : ""}`}
                  value={form.mobile}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  disabled={!form.country}
                  placeholder={form.country ? "" : "Select a country first"}
                  aria-describedby={errors.mobile ? "mobile-error" : undefined}
                  aria-invalid={Boolean(errors.mobile)}
                />
              </div>
              {errors.mobile && (
                <span id="mobile-error" className={styles.errorText}>
                  {errors.mobile}
                </span>
              )}

              <div className={styles.otpBlock}>
                <div className={styles.otpActionsRow}>
                  {otp.mobile.verified ? (
                    <span className={styles.verifiedBadge}>Mobile number verified</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      disabled={otp.mobile.sending || !form.country || !form.mobile}
                      onClick={() => sendOtp("mobile")}
                    >
                      {otp.mobile.sending ? "Sending OTP..." : otp.mobile.sent ? "Resend OTP" : "Send OTP"}
                    </button>
                  )}
                </div>
                {otp.mobile.info && !otp.mobile.verified && <p className={styles.otpInfo}>{otp.mobile.info}</p>}
                {otp.mobile.error && <p className={styles.otpError}>{otp.mobile.error}</p>}
                {otp.mobile.sent && !otp.mobile.verified && (
                  <div className={styles.otpCodeRow}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className={styles.otpInput}
                      placeholder="OTP"
                      value={otp.mobile.code}
                      onChange={(e) =>
                        setOtp((prev) => ({
                          ...prev,
                          mobile: { ...prev.mobile, code: e.target.value.replace(/[^0-9]/g, "").slice(0, 6) }
                        }))
                      }
                    />
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      disabled={otp.mobile.verifying || otp.mobile.code.length < 4}
                      onClick={() => verifyOtp("mobile")}
                    >
                      {otp.mobile.verifying ? "Verifying OTP..." : "Verify OTP"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                E-Mail Id <span className={styles.starMark}>*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                value={form.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <span id="email-error" className={styles.errorText}>
                  {errors.email}
                </span>
              )}

              <div className={styles.otpBlock}>
                <div className={styles.otpActionsRow}>
                  {otp.email.verified ? (
                    <span className={styles.verifiedBadge}>Email verified</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      disabled={otp.email.sending || !form.email}
                      onClick={() => sendOtp("email")}
                    >
                      {otp.email.sending ? "Sending OTP..." : otp.email.sent ? "Resend OTP" : "Send OTP"}
                    </button>
                  )}
                </div>
                {otp.email.info && !otp.email.verified && <p className={styles.otpInfo}>{otp.email.info}</p>}
                {otp.email.error && <p className={styles.otpError}>{otp.email.error}</p>}
                {otp.email.sent && !otp.email.verified && (
                  <div className={styles.otpCodeRow}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className={styles.otpInput}
                      placeholder="OTP"
                      value={otp.email.code}
                      onChange={(e) =>
                        setOtp((prev) => ({
                          ...prev,
                          email: { ...prev.email, code: e.target.value.replace(/[^0-9]/g, "").slice(0, 6) }
                        }))
                      }
                    />
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      disabled={otp.email.verifying || otp.email.code.length < 4}
                      onClick={() => verifyOtp("email")}
                    >
                      {otp.email.verifying ? "Verifying OTP..." : "Verify OTP"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className={styles.helpText}>Verify either your mobile number or email address to continue.</p>
        {errors.otp && (
          <span className={styles.errorText} role="alert">
            {errors.otp}
          </span>
        )}

        <h3 className={styles.sectionTitle}>Visit Information</h3>
        <div className="row">
          <div className="col-md-6 col-12">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="visitObjective">
                Objective of your visit? <span className={styles.starMark}>*</span>
              </label>
              <select
                id="visitObjective"
                className={`${styles.select} ${errors.visitObjective ? styles.inputError : ""}`}
                value={form.visitObjective}
                onChange={(e) => setField("visitObjective", e.target.value)}
                aria-describedby={errors.visitObjective ? "visitObjective-error" : undefined}
                aria-invalid={Boolean(errors.visitObjective)}
              >
                <option value="">Select an option</option>
                {visitObjectives.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {errors.visitObjective && (
                <span id="visitObjective-error" className={styles.errorText}>
                  {errors.visitObjective}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} id="productInterests-label">
            Please specify your product interest <span className={styles.starMark}>*</span>
          </label>
          <div className={styles.checkboxGrid} role="group" aria-labelledby="productInterests-label">
            {productInterestOptions.map((option) => (
              <label key={option} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={form.productInterests.includes(option)}
                  onChange={() => toggleProductInterest(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {errors.productInterests && (
            <span className={styles.errorText} role="alert">
              {errors.productInterests}
            </span>
          )}
        </div>

        <h3 className={styles.sectionTitle}>Consent</h3>
        <div className={styles.disclaimerBox}>
          <strong>Disclaimer:</strong> Exhibitions India is committed to protecting and respecting your privacy, and
          we will only use your personal information to administer your account and to provide the products and
          services you requested from us. From time to time, we would like to contact you via SMS, Email &amp; other
          modes of communications about our events and programs, as well as other content that may be of interest to
          you. Please check the box to continue.
        </div>

        <div className={styles.consentRow}>
          <input
            id="termsAccepted"
            type="checkbox"
            checked={form.termsAccepted}
            onChange={(e) => setField("termsAccepted", e.target.checked)}
            aria-describedby={errors.termsAccepted ? "termsAccepted-error" : undefined}
            aria-invalid={Boolean(errors.termsAccepted)}
          />
          <label htmlFor="termsAccepted">
            I confirm that I am 18 years of age or older and have read and agree to the{" "}
            <button type="button" className={styles.linkBtn} onClick={() => setTermsOpen(true)}>
              Terms &amp; Conditions
            </button>
            . <span className={styles.starMark}>*</span>
          </label>
        </div>
        {errors.termsAccepted && (
          <span id="termsAccepted-error" className={styles.errorText} role="alert">
            {errors.termsAccepted}
          </span>
        )}

        <div className={styles.consentRow}>
          <input
            id="marketingConsent"
            type="checkbox"
            checked={form.marketingConsent}
            onChange={(e) => setField("marketingConsent", e.target.checked)}
          />
          <label htmlFor="marketingConsent">
            I consent to receive marketing communications from EI Group about its events, products and services.
          </label>
        </div>

        <div className={styles.submitRow}>
          <button type="submit" className={styles.submitBtn} disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting..." : "Register"}
          </button>
          <div className={styles.mandatoryNote}>
            Note: <span className={styles.starMark}>*</span> Fields are mandatory
          </div>
        </div>
      </form>

      {termsOpen && (
        <div className={styles.modalOverlay} onClick={() => setTermsOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="terms-title">
            <h3 id="terms-title">Terms &amp; Conditions</h3>
            <p>
              Entry to Wellness India Expo 2027 is permitted only for Business Visitors above{" "}
              {eventEligibility.minimumAge} years of age. Student entry is permitted only on Day{" "}
              {eventEligibility.studentEntryDay} from {eventEligibility.studentEntryTime} onward. By registering, you
              confirm that the information you have provided is accurate and that you agree to abide by the venue
              and event rules of conduct communicated by Exhibitions India Group.
            </p>
            <button type="button" className={`${styles.btnSecondary} ${styles.modalCloseBtn}`} onClick={() => setTermsOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
