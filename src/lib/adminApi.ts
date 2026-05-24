import { apiRequest, isApiConfigured } from "@/lib/api";
import { getSession } from "@/lib/auth";

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
  id_copy_data: string | null;
  passport_copy_data: string | null;
  face_capture_data: string | null;
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
