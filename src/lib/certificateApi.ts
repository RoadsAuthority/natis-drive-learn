import { apiRequest, isApiConfigured } from "@/lib/api";
import { getSession } from "@/lib/auth";

export type CertificateData = {
  fullName: string;
  idNumber: string | null;
  licenceCode: string;
  email: string;
  score: number;
  total: number;
  percentage: number;
  passedAt: string;
  certificateId: string;
};

export async function fetchMyCertificate(): Promise<CertificateData | null> {
  if (!isApiConfigured()) return null;
  const session = await getSession();
  if (!session?.token) return null;
  return apiRequest<CertificateData>("/api/certificate/me", { token: session.token });
}
