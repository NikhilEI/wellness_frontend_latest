"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import OtpVerificationField from "./OtpVerificationField";
import { useOtpVerification } from "@/hooks/useOtpVerification";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010/api";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{10}$/;
const NAME_RE = /^[A-Za-z\s'-]{2,50}$/;
const CITY_RE = /^[A-Za-z\s'-]{2,100}$/;
// This form only collects a 10-digit Indian mobile number (no country-code selector).
const OTP_COUNTRY_CODE = "+91";

interface FormState {
  mediaName: string;
  pressCardNo: string;
  fullName: string;
  designation: string;
  email: string;
  city: string;
  country: string;
  mobile: string;
  termsAccepted: boolean;
}

const initialForm: FormState = {
  mediaName: "",
  pressCardNo: "",
  fullName: "",
  designation: "",
  email: "",
  city: "",
  country: "India",
  mobile: "",
  termsAccepted: false
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

export default function MediaRegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mobileOtp = useOtpVerification();

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleMobileChange(value: string) {
    setField("mobile", value.replace(/[^0-9]/g, "").slice(0, 10));
    if (mobileOtp.state.sent) mobileOtp.reset();
  }

  function handleEmailChange(value: string) {
    setField("email", value);
    if (mobileOtp.state.sent) mobileOtp.reset();
  }

  function sendMobileOtp() {
    if (!MOBILE_RE.test(form.mobile)) {
      setErrors((prev) => ({ ...prev, mobile: "Please enter a valid 10-digit mobile number." }));
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setErrors((prev) => ({ ...prev, email: "Please enter your email address first." }));
      return;
    }
    mobileOtp.send({ channel: "both", mobile: form.mobile, countryCode: OTP_COUNTRY_CODE, email: form.email.trim().toLowerCase() });
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};

    if (!form.mediaName.trim()) next.mediaName = "Please enter the name of your media organisation.";
    if (!NAME_RE.test(form.fullName.trim())) next.fullName = "Full name must be 2-50 letters, no numbers.";
    if (!form.designation.trim()) next.designation = "Please enter your designation.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Please enter a valid email address.";
    if (!CITY_RE.test(form.city.trim())) next.city = "City must be 2-100 letters.";
    if (!form.country) next.country = "Please select a country.";
    if (!MOBILE_RE.test(form.mobile)) next.mobile = "Please enter a valid 10-digit mobile number.";
    if (!form.termsAccepted) next.termsAccepted = "Please accept the Terms and Conditions.";
    if (!mobileOtp.state.verified) next.otp = "Please verify your mobile number via OTP before submitting.";

    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      await postJson(`${API_BASE}/media-registration`, {
        mediaName: form.mediaName.trim(),
        pressCardNo: form.pressCardNo.trim(),
        fullName: form.fullName.trim(),
        designation: form.designation.trim(),
        email: form.email.trim().toLowerCase(),
        city: form.city.trim(),
        country: form.country,
        mobile: form.mobile,
        termsAccepted: form.termsAccepted
      });
      router.push("/response");
    } catch (err) {
      setSubmitting(false);
      setApiError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-booking-form-box-main">
      <form id="mediaRegistrationForm" noValidate onSubmit={handleSubmit}>
        {apiError && (
          <div className="form-text mb-2" style={{ color: "#c0392b" }} role="alert">
            {apiError}
          </div>
        )}

        <div className="row">
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="mediaName">
              Name of Media <span className="star-mark">*</span>
            </label>
            <input
              id="mediaName"
              type="text"
              className={`form-control ${errors.mediaName ? "is-invalid" : ""}`}
              value={form.mediaName}
              onChange={(e) => setField("mediaName", e.target.value)}
            />
            {errors.mediaName && <div className="invalid-feedback d-block">{errors.mediaName}</div>}
          </div>
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="pressCardNo">
              Press Card No.
            </label>
            <input id="pressCardNo" type="text" className="form-control" value={form.pressCardNo} onChange={(e) => setField("pressCardNo", e.target.value)} />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="fullName">
              Full Name <span className="star-mark">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
            />
            {errors.fullName && <div className="invalid-feedback d-block">{errors.fullName}</div>}
          </div>
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="designation">
              Designation <span className="star-mark">*</span>
            </label>
            <input
              id="designation"
              type="text"
              className={`form-control ${errors.designation ? "is-invalid" : ""}`}
              value={form.designation}
              onChange={(e) => setField("designation", e.target.value)}
            />
            {errors.designation && <div className="invalid-feedback d-block">{errors.designation}</div>}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="email">
              E-Mail Id <span className="star-mark">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={form.email}
              onChange={(e) => handleEmailChange(e.target.value)}
            />
            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
          </div>
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="city">
              City <span className="star-mark">*</span>
            </label>
            <input
              id="city"
              type="text"
              className={`form-control ${errors.city ? "is-invalid" : ""}`}
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
            />
            {errors.city && <div className="invalid-feedback d-block">{errors.city}</div>}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="country">
              Country <span className="star-mark">*</span>
            </label>
            <select
              id="country"
              className={`form-control form-select ${errors.country ? "is-invalid" : ""}`}
              value={form.country}
              onChange={(e) => setField("country", e.target.value)}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.country && <div className="invalid-feedback d-block">{errors.country}</div>}
          </div>
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="mobile">
              Mobile No. <span className="star-mark">*</span>
            </label>
            <input
              id="mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
              value={form.mobile}
              onChange={(e) => handleMobileChange(e.target.value)}
            />
            {errors.mobile && <div className="invalid-feedback d-block">{errors.mobile}</div>}
            <OtpVerificationField
              otp={mobileOtp.state}
              verifiedLabel="Mobile number & email verified"
              sendDisabled={!form.mobile || !form.email}
              onSend={sendMobileOtp}
              onVerify={() =>
                mobileOtp.verify(
                  { channel: "both", mobile: form.mobile, countryCode: OTP_COUNTRY_CODE, email: form.email.trim().toLowerCase() },
                  mobileOtp.state.code
                )
              }
              onCodeChange={mobileOtp.setCode}
            />
            {errors.otp && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.otp}
              </div>
            )}
          </div>
        </div>


        <div className="row mb-4">
          <div className="col-sm-12">
            <div className="disclaimer-col-txt">
              <strong>Disclaimer</strong>
              <br />
              Exhibitions India is committed to protecting and respecting your privacy, and we&apos;ll only use your
              personal information to administer your account and to provide the products and services you
              requested from us. From time to time, we would like to contact you about our events and programs, as
              well as other content that may be of interest to you. Please check the box to continue.
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-sm-12">
            <div className="form-check">
              <input
                id="termsAccepted"
                type="checkbox"
                className="form-check-input"
                checked={form.termsAccepted}
                onChange={(e) => setField("termsAccepted", e.target.checked)}
              />
              <label className="form-check-label" htmlFor="termsAccepted">
                I accept the Terms and Conditions.
              </label>
            </div>
            {errors.termsAccepted && <div className="invalid-feedback d-block">{errors.termsAccepted}</div>}
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-sm-12">
            <button type="submit" className="download-brochure-btn leading-voices-btn" disabled={submitting} id="btnMediaRegistration">
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <div className="form-text">
              Note: <span className="star-mark">*</span> Fields are mandatory
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
