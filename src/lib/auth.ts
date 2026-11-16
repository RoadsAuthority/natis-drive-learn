import { apiRequest, isApiConfigured } from "@/lib/api";

export type UserRole = "candidate" | "admin";
type EyeTestStatus = "pending" | "passed" | "uploaded";
type VerificationStatus = "pending" | "approved" | "rejected";
type PaymentStatus = "pending" | "paid";

type SessionUser = {
  id: string;
  email: string;
};

export type Session = {
  token: string;
  user: SessionUser;
};

export type RegistrationInput = {
  email: string;
  password: string;
  firstName: string;
  surname: string;
  idNumber: string;
};

export type UserProfile = {
  id: string;
  email: string;
  first_name: string | null;
  surname: string | null;
  id_number: string | null;
  licence_code: string | null;
  role: UserRole;
  verification_status: VerificationStatus;
  rejection_reason?: string | null;
  eye_test_status: EyeTestStatus;
  payment_status: PaymentStatus;
  test_schedule?: {
    can_take_test: boolean;
    can_book_test: boolean;
    test_block_reason: string | null;
    booking_block_reason: string | null;
    next_test_eligible_at: string | null;
    next_booking_eligible_at: string | null;
    license_collection_from: string | null;
    last_attempt_at: string | null;
    last_attempt_passed: boolean;
    last_attempt_failed: boolean;
    last_attempt_score: number | null;
    last_attempt_total: number | null;
    last_attempt_percentage: number | null;
  } | null;
};

export async function signIn(idNumber: string, password: string) {
  if (!isApiConfigured()) {
    return { error: { message: "Sign-in is unavailable until the authentication API is configured." } };
  }
  try {
    const response = await apiRequest<Session>("/api/auth/login", {
      method: "POST",
      body: { idNumber, password },
    });
    localStorage.setItem("session", JSON.stringify(response));
    return { error: null };
  } catch (error) {
    return { error: { message: (error as Error).message } };
  }
}

export async function signUp(input: RegistrationInput) {
  if (!isApiConfigured()) {
    return { error: { message: "Registration is unavailable until the authentication API is configured." } };
  }
  try {
    const response = await apiRequest<Session>("/api/auth/register", {
      method: "POST",
      body: {
        email: input.email,
        password: input.password,
        first_name: input.firstName,
        surname: input.surname,
        id_number: input.idNumber,
      },
    });
    localStorage.setItem("session", JSON.stringify(response));
    return { error: null };
  } catch (error) {
    return { error: { message: (error as Error).message } };
  }
}

export async function signOut() {
  const rawSession = localStorage.getItem("session");
  localStorage.removeItem("session");
  if (!isApiConfigured() || !rawSession) {
    return;
  }
  try {
    const parsed = JSON.parse(rawSession) as Session;
    if (parsed.token) {
      await apiRequest("/api/auth/logout", {
        method: "POST",
        token: parsed.token,
      });
    }
  } catch {
    // The local session is already cleared; the access token expires within one hour.
  }
}

export async function getSession(): Promise<Session | null> {
  if (!isApiConfigured()) {
    localStorage.removeItem("session");
    return null;
  }
  const raw = localStorage.getItem("session");
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed.token || parsed.token === "local-dev-token" || !parsed.user?.id || !parsed.user.email) {
      localStorage.removeItem("session");
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem("session");
    return null;
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session) return null;

  return apiRequest<UserProfile>("/api/profile/me", { token: session.token });
}

