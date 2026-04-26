import { useEffect, useMemo, useState } from "react";
import { getProfile, getSession, signOut, type Session, type UserProfile } from "@/lib/auth";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const currentSession = await getSession();
        if (!mounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          const p = await getProfile();
          if (!mounted) return;
          setProfile(p);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const isVerified = useMemo(() => {
    return profile?.verification_status === "approved";
  }, [profile]);

  const canTakeTest = useMemo(() => {
    return isVerified && profile?.payment_status === "paid";
  }, [isVerified, profile?.payment_status]);

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isVerified,
    canTakeTest,
    logout: signOut,
  };
}

