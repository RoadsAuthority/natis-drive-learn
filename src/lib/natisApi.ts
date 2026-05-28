import { apiRequest, isApiConfigured } from "@/lib/api";
import { getSession } from "@/lib/auth";
import type { TestQuestion } from "@/types/question";

function assertApiConfigured() {
  if (!isApiConfigured()) {
    throw new Error("API is not configured. Set VITE_API_BASE_URL in .env.");
  }
}

async function withToken() {
  assertApiConfigured();
  const session = await getSession();
  if (!session?.token) {
    throw new Error("No active session token. Please sign in again.");
  }
  return session.token;
}

export async function submitProfileVerification(payload: FormData) {
  const token = await withToken();
  await apiRequest("/api/verification/submit", {
    method: "POST",
    body: payload,
    isFormData: true,
    token,
  });
}

export async function submitEyeTest(status: "passed" | "uploaded", doctorLetter?: File | null) {
  const token = await withToken();
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
  if (!paid) {
    throw new Error("Payment must be completed before booking.");
  }
  const token = await withToken();
  await apiRequest("/api/bookings", {
    method: "POST",
    token,
    body: { bookingDate, slotTime },
  });
}

export async function confirmPayment(providerOrderId: string, amount = 12) {
  const token = await withToken();
  await apiRequest("/api/payments/confirm", {
    method: "POST",
    token,
    body: {
      provider: "paypal",
      providerOrderId,
      amount,
      status: "completed",
    },
  });
}

export async function fetchQuestions() {
  const token = await withToken();
  return apiRequest<TestQuestion[]>("/api/questions/active", { token });
}

export async function markAttempt(answers: Record<string, string>) {
  const token = await withToken();
  return apiRequest<{ score: number; percentage: number; passed: boolean; total: number }>(
    "/api/attempts/mark",
    {
      method: "POST",
      token,
      body: { answers },
    }
  );
}

export async function saveAttempt(
  score: number,
  total: number,
  percentage: number,
  passed: boolean,
  proctoring?: { tabSwitches: number; faceMissingEvents: number; snapshots: string[] }
) {
  const token = await withToken();
  return apiRequest<{
    message: string;
    reviewFlagged: boolean;
    suspicionScore: number;
    nextTestEligibleAt: string | null;
    nextBookingEligibleAt: string | null;
    licenseCollectionFrom: string | null;
  }>("/api/attempts", {
    method: "POST",
    token,
    body: { score, total, percentage, passed, proctoring },
  });
}

export async function requestResultDocument(results: unknown) {
  const token = await withToken();
  await apiRequest("/api/results/document", {
    method: "POST",
    token,
    body: { results },
  });
}

