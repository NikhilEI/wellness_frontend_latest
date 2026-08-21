"use client";

import { useEffect, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010/api";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{10}$/;
const NAME_RE = /^[A-Za-z\s'-]{2,30}$/;
const CITY_RE = /^[A-Za-z\s'-]{2,50}$/;
const ORG_RE = /^.{2,30}$/;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function setMsg(el: HTMLElement | null, text: string, isError: boolean) {
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "#c0392b" : "#2e7d32";
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

function wireNewsletterForm() {
  const form = document.getElementById("newsletterForm") as HTMLFormElement | null;
  if (!form) return;

  const emailInput = form.querySelector<HTMLInputElement>('input[name="EMAIL"]');

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msgEl = document.getElementById("newsletterFormMsg");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const email = emailInput ? emailInput.value.trim() : "";
    if (!EMAIL_RE.test(email)) {
      emailInput?.setCustomValidity("Please enter a valid email address.");
      form.reportValidity();
      emailInput?.setCustomValidity("");
      return;
    }

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setMsg(msgEl, "Submitting...", false);

    postJson(`${API_BASE}/newsletter`, { email, sourcePage: window.location.pathname })
      .then(() => {
        window.location.href = "/response-newsletter";
      })
      .catch((err: ApiError) => {
        if (err.status === 409) {
          window.alert(err.message);
        }
        setMsg(msgEl, err.message, true);
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

function wireSpaceBookingForm() {
  const form = document.getElementById("spaceBookingForm") as HTMLFormElement | null;
  if (!form) return;

  const firstNameInput = form.querySelector<HTMLInputElement>('[name="First_Name"]');
  const lastNameInput = form.querySelector<HTMLInputElement>('[name="Last_Name"]');
  const orgInput = form.querySelector<HTMLInputElement>('[name="Organisation"]');
  const emailInput = form.querySelector<HTMLInputElement>('[name="Email"]');
  const cityInput = form.querySelector<HTMLInputElement>('[name="City"]');
  const mobileInput = form.querySelector<HTMLInputElement>('[name="Mobile_No"]');

  // type="number" doesn't stop letters/symbols in every browser (Firefox especially),
  // and doesn't enforce maxlength at all — strip anything non-numeric as the user types
  // and hard-cap at 10 digits.
  mobileInput?.addEventListener("input", () => {
    mobileInput.value = mobileInput.value.replace(/[^0-9]/g, "").slice(0, 10);
  });

  const fieldCheck = (
    input: HTMLInputElement | null | undefined,
    val: string,
    re: RegExp,
    message: string
  ) => {
    if (re.test(val)) return true;
    input?.setCustomValidity(message);
    form.reportValidity();
    input?.setCustomValidity("");
    return false;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msgEl = document.getElementById("spaceBookingFormMsg");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const value = (name: string) =>
      form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)?.value.trim() ?? "";

    const firstName = value("First_Name");
    if (!fieldCheck(firstNameInput, firstName, NAME_RE, "Please enter a valid first name (letters only, 2-30 characters).")) return;

    const lastName = value("Last_Name");
    if (!fieldCheck(lastNameInput, lastName, NAME_RE, "Please enter a valid last name (letters only, 2-30 characters).")) return;

    const organisation = value("Organisation");
    if (!fieldCheck(orgInput, organisation, ORG_RE, "Organisation name must be 2-30 characters.")) return;

    const email = value("Email");
    if (!fieldCheck(emailInput, email, EMAIL_RE, "Please enter a valid email address.")) return;

    const city = value("City");
    if (!fieldCheck(cityInput, city, CITY_RE, "Please enter a valid city (letters only, 2-50 characters).")) return;

    const mobileNo = value("Mobile_No");
    if (!fieldCheck(mobileInput, mobileNo, MOBILE_RE, "Please enter a valid 10-digit mobile number.")) return;

    let recaptchaToken = "";
    if (window.grecaptcha && window.__recaptchaWidgetId !== undefined) {
      recaptchaToken = window.grecaptcha.getResponse(window.__recaptchaWidgetId);
      if (!recaptchaToken) {
        setMsg(msgEl, "Please complete the captcha verification.", true);
        return;
      }
    }

    const payload = {
      firstName,
      lastName,
      organisation,
      designation: value("Designation"),
      email,
      learnAboutExpo: value("Learn_About_Expo"),
      city,
      country: value("Country"),
      mobileNo,
      shellSpace: value("Shell_Space"),
      recaptchaToken
    };

    const submitBtn = document.getElementById("btnRegistration") as HTMLInputElement | null;
    if (submitBtn) submitBtn.disabled = true;
    setMsg(msgEl, "Submitting...", false);

    postJson(`${API_BASE}/space-booking`, payload)
      .then(() => {
        window.location.href = "/response";
      })
      .catch((err: ApiError) => {
        setMsg(msgEl, err.message, true);
        if (window.grecaptcha && window.__recaptchaWidgetId !== undefined) {
          window.grecaptcha.reset(window.__recaptchaWidgetId);
        }
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

export default function SiteForms() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    wireNewsletterForm();
    wireSpaceBookingForm();
  }, []);

  return null;
}
