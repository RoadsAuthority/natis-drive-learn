import { apiRequest, isApiConfigured } from "@/lib/api";
import { getSession } from "@/lib/auth";

async function withToken() {
  const session = await getSession();
  return session?.token ?? null;
}

export async function submitProfileVerification(payload: FormData) {
  if (!isApiConfigured()) return;
  const token = await withToken();
  if (!token) return;
  await apiRequest("/api/verification/submit", {
    method: "POST",
    body: payload,
    isFormData: true,
    token,
  });
}

export async function submitEyeTest(status: "passed" | "uploaded", doctorLetter?: File | null) {
  if (!isApiConfigured()) return;
  const token = await withToken();
  if (!token) return;
  const payload = new FormData();
  payload.append("status", status);
  if (doctorLetter) payload.append("doctorLetter", doctorLetter);
  await apiRequest("/api/eye-test/submit", {
    method: "POST",
    body: payload,
    isFormData: true,
    token,
  });
}

export async function createBooking(bookingDate: string, slotTime: string, paid: boolean) {
  if (!isApiConfigured()) return;
  const token = await withToken();
  if (!token) return;
  await apiRequest("/api/bookings", {
    method: "POST",
    token,
    body: { bookingDate, slotTime, paid },
  });
}

export async function fetchQuestions() {
  if (!isApiConfigured()) return null;
  const token = await withToken();
  if (!token) return null;
  return apiRequest<Array<{ question: string; options: Array<{ id: string; text: string }>; correctAnswer: string }>>(
    "/api/questions/active",
    { token }
  );
}

export async function markAttempt(answers: Record<number, string>, total: number) {
  if (!isApiConfigured()) return null;
  const token = await withToken();
  if (!token) return null;
  return apiRequest<{ score: number; percentage: number; passed: boolean }>("/api/attempts/mark", {
    method: "POST",
    token,
    body: { answers, total },
  });
}

export async function saveAttempt(score: number, total: number, percentage: number, passed: boolean) {
  if (!isApiConfigured()) return;
  const token = await withToken();
  if (!token) return;
  await apiRequest("/api/attempts", {
    method: "POST",
    token,
    body: { score, total, percentage, passed },
  });
}

export async function requestResultDocument(results: unknown) {
  if (!isApiConfigured()) return;
  const token = await withToken();
  if (!token) return;
  await apiRequest("/api/results/document", {
    method: "POST",
    token,
    body: { results },
  });
}

