"use client";

import { useEffect, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010/api";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{6,20}$/;

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

  const emailInput = form.querySelector<HTMLInputElement>('[name="Email"]');
  const mobileInput = form.querySelector<HTMLInputElement>('[name="Mobile_No"]');

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msgEl = document.getElementById("spaceBookingFormMsg");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const value = (name: string) =>
      form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)?.value.trim() ?? "";

    const email = value("Email");
    if (!EMAIL_RE.test(email)) {
      emailInput?.setCustomValidity("Please enter a valid email address.");
      form.reportValidity();
      emailInput?.setCustomValidity("");
      return;
    }

    const mobileNo = value("Mobile_No");
    if (!MOBILE_RE.test(mobileNo)) {
      mobileInput?.setCustomValidity("Please enter a valid mobile number (digits only, 6-20 digits).");
      form.reportValidity();
      mobileInput?.setCustomValidity("");
      return;
    }

    const payload = {
      firstName: value("First_Name"),
      lastName: value("Last_Name"),
      organisation: value("Organisation"),
      designation: value("Designation"),
      email,
      learnAboutExpo: value("Learn_About_Expo"),
      city: value("City"),
      country: value("Country"),
      mobileNo,
      shellSpace: value("Shell_Space")
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
