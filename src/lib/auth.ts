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
  } | null;
};

export async function signIn(email: string, password: string) {
  if (!isApiConfigured()) {
    const fallback: Session = {
      token: "local-dev-token",
      user: { id: "local-user", email },
    };
    localStorage.setItem("session", JSON.stringify(fallback));
    return { error: null };
  }
  try {
    const response = await apiRequest<Session>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem("session", JSON.stringify(response));
    return { error: null };
  } catch (error) {
    return { error: { message: (error as Error).message } };
  }
}

export async function signUp(email: string, password: string, metadata: Record<string, string>) {
  if (!isApiConfigured()) {
    const fallback: Session = {
      token: "local-dev-token",
      user: { id: "local-user", email },
    };
    localStorage.setItem("session", JSON.stringify(fallback));
    return { error: null };
  }
  try {
    const response = await apiRequest<Session>("/api/auth/register", {
      method: "POST",
      body: { email, password, ...metadata },
    });
    localStorage.setItem("session", JSON.stringify(response));
    return { error: null };
  } catch (error) {
    return { error: { message: (error as Error).message } };
  }
}

export async function signOut() {
  const session = localStorage.getItem("session");
  localStorage.removeItem("session");
  if (!isApiConfigured() || !session) {
    return;
  }
  const parsed = JSON.parse(session) as Session;
  await apiRequest("/api/auth/logout", {
    method: "POST",
    token: parsed.token,
  });
}

export async function getSession(): Promise<Session | null> {
  const raw = localStorage.getItem("session");
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as Session;
}

export async function getProfile(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session) return null;

  if (!isApiConfigured()) {
    const local = localStorage.getItem("profile");
    if (!local) {
      return {
        id: session.user.id,
        email: session.user.email,
        first_name: null,
        surname: null,
        id_number: null,
        licence_code: null,
        role: "candidate",
        verification_status: "pending",
        rejection_reason: null,
        eye_test_status: (localStorage.getItem("eyeTestStatus") as EyeTestStatus) ?? "pending",
        payment_status: (localStorage.getItem("paymentStatus") as PaymentStatus) ?? "pending",
      };
    }
    const parsed = JSON.parse(local) as {
      firstName?: string;
      surname?: string;
      idNumber?: string;
      licenceCode?: string;
    };
    return {
      id: session.user.id,
      email: session.user.email,
      first_name: parsed.firstName ?? null,
      surname: parsed.surname ?? null,
      id_number: parsed.idNumber ?? null,
      licence_code: parsed.licenceCode ?? null,
      role: "candidate",
      verification_status: "pending",
      rejection_reason: null,
      eye_test_status: (localStorage.getItem("eyeTestStatus") as EyeTestStatus) ?? "pending",
      payment_status: (localStorage.getItem("paymentStatus") as PaymentStatus) ?? "pending",
    };
  }

  return apiRequest<UserProfile>("/api/profile/me", { token: session.token });
}

