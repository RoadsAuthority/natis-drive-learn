import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useEligibility } from "@/hooks/useEligibility";
import { useLanguage } from "@/i18n/LanguageProvider";

type Props = { children: React.ReactNode };

export default function LearnerWorkspace({ children }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuthContext();
  const { t } = useLanguage();
  const { testPassed } = useEligibility();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const items = [
    { to: "/portal", label: t("portal.journey"), icon: LayoutDashboard, end: true },
    { to: "/my-profile", label: t("profile.title"), icon: UserRound },
    { to: "/study", label: t("portal.study"), icon: BookOpen },
    { to: "/eye-test", label: t("portal.stepEyeTitle"), icon: Eye },
    { to: "/booking", label: t("portal.stepBookTitle"), icon: CalendarDays },
    { to: "/instructions", label: t("portal.stepTestTitle"), icon: ClipboardCheck },
    ...(testPassed ? [{ to: "/certificate", label: t("portal.certificate"), icon: Award }] : []),
  ];
  const pageTitle = pathname === "/test" ? t("portal.stepTestTitle") : items.find((item) => item.to === pathname)?.label ?? t("portal.title");
  const displayName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ") || user?.email || t("workspace.learnerFallback");
  const initials = displayName.slice(0, 1).toUpperCase();

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background p-2 text-foreground lg:p-6">
      {menuOpen ? (
        <button
          type="button"
          aria-label={t("workspace.closeNavigation")}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-2 left-2 z-50 flex w-60 flex-col rounded-xl bg-[hsl(var(--workspace-rail))] px-4 py-5 text-white shadow-xl transition-transform duration-200 lg:inset-y-6 lg:left-6 lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[hsl(var(--workspace-rail))]">
              <span className="text-lg font-black">N</span>
            </div>
            <div>
              <p className="font-bold leading-tight">NaTIS</p>
              <p className="text-xs text-white/75">{t("workspace.learner")}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("workspace.closeNavigation")}
            onClick={() => setMenuOpen(false)}
            className="rounded-md p-2 text-white/80 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/60">{t("workspace.section")}</p>
        <nav className="space-y-1" aria-label="Learner navigation">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                  isActive || (pathname === "/test" && to === "/instructions")
                    ? "bg-[hsl(var(--workspace-rail-active))] text-white shadow-sm"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/20 pt-4">
          <div className="mb-3 flex min-w-0 items-center gap-3 px-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-white/65">{profile?.id_number ?? user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-white/85 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            {t("portal.signOut")}
          </button>
        </div>
      </aside>

      <div className="min-h-[calc(100vh-1rem)] overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm lg:ml-[256px] lg:min-h-[calc(100vh-3rem)]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-border/70 bg-card/95 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={t("workspace.openNavigation")}
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-2 text-foreground hover:bg-muted lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">NaTIS / {t("workspace.learner")}</p>
              <h1 className="truncate text-lg font-semibold text-foreground">{pageTitle}</h1>
            </div>
          </div>
          <LanguageSwitcher className="shrink-0" />
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}