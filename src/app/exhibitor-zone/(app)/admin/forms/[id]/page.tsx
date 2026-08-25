"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../../_lib/apiClient";
import StatusBadge from "../../../../_components/StatusBadge";

interface Submission {
  id: number;
  template_name: string;
  company_name: string;
  status: string;
  version: number;
  data: Record<string, unknown>;
}

function toLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export default function AdminFormReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<{ submission: Submission }>(`/forms/submissions/${id}`)
      .then((body) => setSubmission(body.submission))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load submission."));
  }, [id]);

  async function review(status: string) {
    setSubmitting(true);
    setError("");
    try {
      await api.patch(`/forms/submissions/${id}/status`, { status, reviewerNotes: notes || undefined });
      router.push("/exhibitor-zone/admin/forms");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update submission.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">{submission?.template_name || "…"}</h1>
        <p className="content-subtitle">Review submitted form data and record a decision</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {submission && (
        <div className="grid mb-3" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <span className="card-title">{submission.company_name}</span>
                <div className="text-xs text-muted mt-1">Version {submission.version}</div>
              </div>
              <StatusBadge status={submission.status} />
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column" }}>
                {Object.entries(submission.data).map(([key, value]) => (
                  <div key={key} className="d-flex" style={{ borderBottom: "1px solid var(--ez-divider)", padding: "0.625rem 0" }}>
                    <span className="text-small text-muted" style={{ flex: "0 0 40%" }}>
                      {toLabel(key)}
                    </span>
                    <span className="text-small" style={{ color: "var(--ez-dark)" }}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Review</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button type="button" className="btn btn-success" disabled={submitting} onClick={() => review("approved")}>
                  Approve
                </button>
                <button type="button" className="btn btn-warning" disabled={submitting} onClick={() => review("changes_requested")}>
                  Request Changes
                </button>
                <button type="button" className="btn btn-danger" disabled={submitting} onClick={() => review("rejected")}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Link href="/exhibitor-zone/admin/forms" className="btn btn-outline-primary">
        <i className="bx bx-chevron-left" /> Back to Reviews
      </Link>
    </>
  );
}
