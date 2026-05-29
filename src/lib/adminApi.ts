import { apiRequest, isApiConfigured } from "@/lib/api";
import { getSession } from "@/lib/auth";
import type { AdminDocumentKind } from "@/lib/documentUrl";

async function adminToken() {
  const session = await getSession();
  return session?.token ?? null;
}

export type AdminStats = {
  totalProfiles: number;
  pendingVerification: number;
  totalBookings: number;
  totalAttempts: number;
  passedAttempts: number;
  activeQuestions: number;
};

export type VerificationQueueRow = {
  id: string;
  email: string;
  first_name: string | null;
  surname: string | null;
  id_number: string | null;
  verification_status: string;
  created_at: string;
  id_copy_path: string | null;
  passport_copy_path: string | null;
  face_capture_path: string | null;
  has_id_copy?: boolean;
  has_passport_copy?: boolean;
  has_face_capture?: boolean;
  has_doctor_letter?: boolean;
  doctor_letter_path: string | null;
  documents_updated_at: string | null;
};

export async function fetchAdminStats(): Promise<AdminStats | null> {
  if (!isApiConfigured()) return null;
  const token = await adminToken();
  if (!token) return null;
  return apiRequest<AdminStats>("/api/admin/stats", { token });
}

export async function fetchVerificationQueue(): Promise<VerificationQueueRow[] | null> {
  if (!isApiConfigured()) return null;
  const token = await adminToken();
  if (!token) return null;
  return apiRequest<VerificationQueueRow[]>("/api/admin/verification-queue", { token });
}

export async function postVerificationDecision(
  profileId: string,
  decision: "approved" | "rejected",
  reason?: string
) {
  if (!isApiConfigured()) return null;
  const token = await adminToken();
  if (!token) return null;
  return apiRequest<{ profile: { id: string; email: string; verification_status: string } }>(
    `/api/admin/verification/${profileId}`,
    { method: "POST", body: { decision, reason }, token }
  );
}

export async function fetchAdminBookings() {
  if (!isApiConfigured()) return null;
  const token = await adminToken();
  if (!token) return null;
  return apiRequest<unknown[]>("/api/admin/bookings", { token });
}

export type LiveTestSession = {
  profile_id: string;
  started_at: string;
  last_heartbeat_at: string;
  current_question: number;
  total_questions: number;
  answered_count: number;
  tab_switches: number;
  face_missing_events: number;
  latest_snapshot_data: string | null;
  email: string;
  first_name: string | null;
  surname: string | null;
};

export async function fetchAdminLiveTests(): Promise<LiveTestSession[] | null> {
  if (!isApiConfigured()) return null;
  const token = await adminToken();
  if (!token) return null;
  return apiRequest<LiveTestSession[]>("/api/admin/live-tests", { token });
}

export async function fetchAdminAttempts() {
  if (!isApiConfigured()) return null;
  const token = await adminToken();
  if (!token) return null;
  return apiRequest<unknown[]>("/api/admin/attempts", { token });
}

export async function fetchAdminAudit() {
  if (!isApiConfigured()) return null;
  const token = await adminToken();
  if (!token) return null;
  return apiRequest<unknown[]>("/api/admin/audit", { token });
}

export async function fetchAdminDocument(
  profileId: string,
  kind: AdminDocumentKind
): Promise<{ blob: Blob; objectUrl: string } | null> {
  if (!isApiConfigured()) return null;
  const token = await adminToken();
  if (!token) return null;

  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const response = await fetch(`${apiBase}/api/admin/documents/${profileId}/${kind}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let message = `Could not load document (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  return { blob, objectUrl: URL.createObjectURL(blob) };
}
