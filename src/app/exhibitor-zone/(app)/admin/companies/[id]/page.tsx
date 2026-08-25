"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../_lib/apiClient";
import { formatDate } from "../../../../_lib/format";
import StatusBadge from "../../../../_components/StatusBadge";

interface Profile {
  id: number;
  legal_name: string;
  display_name: string;
  company_type: string | null;
  industry_type: string | null;
  website: string | null;
  address_line1: string;
  city: string;
  country: string;
  email: string | null;
  phone: string | null;
  profile_status: string;
  rejection_reason: string | null;
  is_verified: number;
}

interface Document {
  id: number;
  document_type: string;
  original_filename: string;
  is_verified: number;
}

export default function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ profile: Profile }>(`/exhibitors/${id}`)
      .then((body) => {
        setProfile(body.profile);
        return api.get<{ documents: Document[] }>(`/documents?exhibitorProfileId=${id}`);
      })
      .then((body) => setDocuments(body.documents))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load company."));
  }, [id]);

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">{profile?.display_name || "…"}</h1>
        <p className="content-subtitle">Exhibitor company details and uploaded documents</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {profile && (
        <div className="grid mb-3" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Company Details</span>
              <StatusBadge status={profile.profile_status} />
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  ["Legal Name", profile.legal_name],
                  ["Type", profile.company_type || "—"],
                  ["Industry", profile.industry_type || "—"],
                  ["Website", profile.website || "—"],
                  ["Address", `${profile.address_line1}, ${profile.city}, ${profile.country}`],
                  ["Email", profile.email || "—"],
                  ["Phone", profile.phone || "—"]
                ].map(([label, value]) => (
                  <div key={label} className="d-flex justify-between" style={{ borderBottom: "1px solid var(--ez-divider)", paddingBottom: "0.875rem" }}>
                    <span className="text-small text-muted">{label}</span>
                    <span className="fw-600 text-small" style={{ color: "var(--ez-dark)", textAlign: "right" }}>
                      {value}
                    </span>
                  </div>
                ))}
                {profile.rejection_reason && (
                  <div className="d-flex justify-between">
                    <span className="text-small text-muted">Rejection Reason</span>
                    <span className="fw-600 text-small" style={{ color: "var(--ez-danger)", textAlign: "right" }}>
                      {profile.rejection_reason}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Documents</span>
            </div>
            {documents.length === 0 ? (
              <div className="card-body">
                <p className="text-muted text-small mb-0">No documents uploaded.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="d-flex justify-between align-center"
                    style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--ez-divider)" }}
                  >
                    <a href={api.fileUrl(`/documents/${d.id}/file`)} target="_blank" rel="noreferrer" className="text-small">
                      {d.document_type.replace(/_/g, " ")}
                    </a>
                    {d.is_verified ? <span className="badge badge-success">Verified</span> : <span className="badge badge-secondary">Pending</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Link href="/exhibitor-zone/admin/companies" className="btn btn-outline-primary">
        <i className="bx bx-chevron-left" /> Back to Exhibitors
      </Link>
    </>
  );
}
