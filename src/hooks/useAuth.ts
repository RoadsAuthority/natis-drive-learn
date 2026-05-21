import { useCallback, useEffect, useMemo, useState } from "react";
import { getProfile, getSession, signOut, type Session, type UserProfile } from "@/lib/auth";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const currentSession = await getSession();
    setSession(currentSession);
    if (currentSession?.user) {
      try {
        const p = await getProfile();
        setProfile(p);
        return p;
      } catch {
        setProfile(null);
        return null;
      }
    } else {
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const currentSession = await getSession();
        if (!mounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          try {
            const p = await getProfile();
            if (!mounted) return;
            setProfile(p);
          } catch {
            if (mounted) setProfile(null);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

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

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    setProfile(null);
  }, []);

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isVerified,
    canTakeTest,
    refresh,
    logout,
  };
}

