"use client";

import { useState, type FormEvent } from "react";
import styles from "./VisitorRegistrationForm.module.css";
import OtpVerificationField from "./OtpVerificationField";
import { useOtpVerification } from "@/hooks/useOtpVerification";
import { countryNames } from "@/data/countryNames";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010/api";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{10}$/;
const NAME_RE = /^[A-Za-z\s'-]{2,100}$/;
const CITY_RE = /^[A-Za-z\s'-]{2,100}$/;
const WEBSITE_RE = /^[^\s]+\.[a-zA-Z]{2,}([^\s]*)?$/;
const COMPANY_PROFILE_MAX_LENGTH = 400;
// This form only collects a 10-digit Indian mobile number (no country-code selector).
const OTP_COUNTRY_CODE = "+91";

interface FormState {
  fullName: string;
  designation: string;
  company: string;
  email: string;
  mobile: string;
  city: string;
  country: string;
  website: string;
  outlets: string;
  companyTurnover: string;
  companyProfile: string;
  termsAccepted: boolean;
}

const initialForm: FormState = {
  fullName: "",
  designation: "",
  company: "",
  email: "",
  mobile: "",
  city: "",
  country: "",
  website: "",
  outlets: "",
  companyTurnover: "",
  companyProfile: "",
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

export default function HostedBuyersRegistrationForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [apiError, setApiError] = useState("");
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

  function sendMobileOtp() {
    if (!MOBILE_RE.test(form.mobile)) {
      setErrors((prev) => ({ ...prev, mobile: "Please enter a valid 10-digit mobile number." }));
      return;
    }
    mobileOtp.send({ channel: "mobile", mobile: form.mobile, countryCode: OTP_COUNTRY_CODE });
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!NAME_RE.test(form.fullName.trim())) next.fullName = "Full Name must be letters only, 2-100 characters.";
    if (!form.designation.trim()) next.designation = "Please enter your designation.";
    if (!form.company.trim()) next.company = "Please enter your company name.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Please enter a valid email address.";
    if (!MOBILE_RE.test(form.mobile)) next.mobile = "Please enter a valid 10-digit mobile number.";
    if (!CITY_RE.test(form.city.trim())) next.city = "City must be letters only, 2-100 characters.";
    if (!form.country) next.country = "Please select a country.";
    if (!WEBSITE_RE.test(form.website.trim())) next.website = "Please enter a valid website.";
    if (!form.outlets.trim()) next.outlets = "Please enter the number of outlets / channel partners.";
    if (!form.companyTurnover.trim()) next.companyTurnover = "Please enter your company turnover.";
    if (!form.companyProfile.trim()) next.companyProfile = "Please enter your company profile.";
    else if (form.companyProfile.length > COMPANY_PROFILE_MAX_LENGTH) {
      next.companyProfile = `Company Profile must be ${COMPANY_PROFILE_MAX_LENGTH} characters or fewer.`;
    }
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

    setStatus("submitting");

    try {
      await postJson(`${API_BASE}/hosted-buyer-registration`, {
        fullName: form.fullName.trim(),
        designation: form.designation.trim(),
        company: form.company.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile,
        city: form.city.trim(),
        country: form.country,
        website: form.website.trim(),
        outlets: form.outlets.trim(),
        companyTurnover: form.companyTurnover.trim(),
        companyProfile: form.companyProfile.trim(),
        termsAccepted: form.termsAccepted
      });
      window.location.href = "/response";
    } catch (err) {
      setStatus("idle");
      setApiError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const charsLeft = COMPANY_PROFILE_MAX_LENGTH - form.companyProfile.length;

  return (
    <div className="space-booking-form-box-main">
      <form id="hostedBuyersRegistrationForm" noValidate onSubmit={handleSubmit}>
        {apiError && (
          <div className={styles.apiError} role="alert">
            {apiError}
          </div>
        )}

        <div className="row">
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="fullName">
              Full Name <span className="star-mark">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              maxLength={100}
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
              maxLength={100}
              className={`form-control ${errors.designation ? "is-invalid" : ""}`}
              value={form.designation}
              onChange={(e) => setField("designation", e.target.value)}
            />
            {errors.designation && <div className="invalid-feedback d-block">{errors.designation}</div>}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="company">
              Company <span className="star-mark">*</span>
            </label>
            <input
              id="company"
              type="text"
              maxLength={150}
              className={`form-control ${errors.company ? "is-invalid" : ""}`}
              value={form.company}
              onChange={(e) => setField("company", e.target.value)}
            />
            {errors.company && <div className="invalid-feedback d-block">{errors.company}</div>}
          </div>
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="email">
              E-Mail Id <span className="star-mark">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
          </div>
        </div>

        <div className="row">
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
              verifiedLabel="Mobile number verified"
              sendDisabled={!form.mobile}
              onSend={sendMobileOtp}
              onVerify={() =>
                mobileOtp.verify({ channel: "mobile", mobile: form.mobile, countryCode: OTP_COUNTRY_CODE }, mobileOtp.state.code)
              }
              onCodeChange={mobileOtp.setCode}
            />
            {errors.otp && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.otp}
              </div>
            )}
          </div>
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="city">
              City <span className="star-mark">*</span>
            </label>
            <input
              id="city"
              type="text"
              maxLength={100}
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
              <option value="">Choose a Country</option>
              {countryNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errors.country && <div className="invalid-feedback d-block">{errors.country}</div>}
          </div>
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="website">
              Website <span className="star-mark">*</span>
            </label>
            <input
              id="website"
              type="text"
              className={`form-control ${errors.website ? "is-invalid" : ""}`}
              value={form.website}
              onChange={(e) => setField("website", e.target.value)}
              placeholder="www.example.com"
            />
            {errors.website && <div className="invalid-feedback d-block">{errors.website}</div>}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="outlets">
              No. of Outlets / Channel Partners <span className="star-mark">*</span>
            </label>
            <input
              id="outlets"
              type="text"
              maxLength={100}
              className={`form-control ${errors.outlets ? "is-invalid" : ""}`}
              value={form.outlets}
              onChange={(e) => setField("outlets", e.target.value)}
            />
            {errors.outlets && <div className="invalid-feedback d-block">{errors.outlets}</div>}
          </div>
          <div className="col-md-6 mb-4">
            <label className="form-label" htmlFor="companyTurnover">
              Company Turn Over <span className="star-mark">*</span>
            </label>
            <input
              id="companyTurnover"
              type="text"
              maxLength={100}
              className={`form-control ${errors.companyTurnover ? "is-invalid" : ""}`}
              value={form.companyTurnover}
              onChange={(e) => setField("companyTurnover", e.target.value)}
            />
            {errors.companyTurnover && <div className="invalid-feedback d-block">{errors.companyTurnover}</div>}
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12 mb-4">
            <label className="form-label" htmlFor="companyProfile">
              Company Profile <span className="star-mark">*</span>
            </label>
            <textarea
              id="companyProfile"
              rows={5}
              maxLength={COMPANY_PROFILE_MAX_LENGTH}
              className={`form-control ${errors.companyProfile ? "is-invalid" : ""}`}
              value={form.companyProfile}
              onChange={(e) => setField("companyProfile", e.target.value.slice(0, COMPANY_PROFILE_MAX_LENGTH))}
            />
            <div className="d-flex justify-content-between mt-1">
              {errors.companyProfile ? (
                <div className="invalid-feedback d-block mb-0">{errors.companyProfile}</div>
              ) : (
                <span />
              )}
              <span className={styles.helpText}>No. of characters left: {charsLeft}</span>
            </div>
          </div>
        </div>


        <div className="row mb-4">
          <div className="col-sm-12">
            <div className="disclaimer-col-txt">
              <strong>Disclaimer</strong>
              <br />
              Exhibitions India is committed to protecting and respecting your privacy, and we&apos;ll only use your
              personal information to administer your account and to provide the products and services you
              requested from us.
              <br />
              <br />
              From time to time, we would like to contact you about our events and programs, as well as other
              content that may be of interest to you. Please check the box to continue.
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
                I acknowledge that I have read, and do hereby accept the terms and conditions mentioned below.
              </label>
            </div>
            {errors.termsAccepted && <div className="invalid-feedback d-block">{errors.termsAccepted}</div>}
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-sm-12">
            <button
              type="submit"
              className="download-brochure-btn leading-voices-btn"
              disabled={status === "submitting"}
              id="btnHostedBuyerRegistration"
            >
              {status === "submitting" ? "Submitting..." : "Submit"}
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
