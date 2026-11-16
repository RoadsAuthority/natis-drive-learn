import { useCallback, useEffect, useMemo, useState } from "react";
import { getProfile, getSession, signOut, type Session, type UserProfile } from "@/lib/auth";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem("session");
    setSession(null);
    setProfile(null);
  }, []);

  const refresh = useCallback(async () => {
    const currentSession = await getSession();
    setSession(currentSession);
    if (currentSession?.user) {
      try {
        const p = await getProfile();
        if (!p) {
          clearSession();
          return null;
        }
        setProfile(p);
        return p;
      } catch {
        clearSession();
        return null;
      }
    } else {
      setProfile(null);
      return null;
    }
  }, [clearSession]);

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
            if (!p) {
              clearSession();
              return;
            }
            setProfile(p);
          } catch {
            if (mounted) clearSession();
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
  }, [clearSession]);

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

