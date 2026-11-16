import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { signIn, signUp } from "@/lib/auth";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Login = () => {
  const navigate = useNavigate();
  const { refresh } = useAuthContext();
  const { t } = useLanguage();
  const [loginData, setLoginData] = useState({ idNumber: "", password: "" });
  const [registerData, setRegisterData] = useState({
    firstName: "",
    surname: "",
    idNumber: "",
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.idNumber.trim() || !loginData.password) {
      toast.error(t("login.fillAll"));
      return;
    }
    if (!/^\d+$/.test(loginData.idNumber.trim())) {
      toast.error(t("login.idDigitsOnly"));
      return;
    }
    try {
      const { error } = await signIn(loginData.idNumber.trim(), loginData.password);
      if (error) {
        toast.error(error.message);
        return;
      }
      const profile = await refresh();
      if (!profile) {
        toast.error(t("login.profileLoadFailed"));
        return;
      }
      toast.success(t("login.loginSuccess"));
      navigate(profile?.role === "admin" ? "/admin" : "/portal");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstName = registerData.firstName.trim();
    const surname = registerData.surname.trim();
    const email = registerData.email.trim().toLowerCase();
    const idNumber = registerData.idNumber.trim();
    if (!firstName || !surname || !email || !idNumber || !registerData.password) {
      toast.error(t("login.fillAll"));
      return;
    }
    if (!/^\d{1,32}$/.test(idNumber)) {
      toast.error(t("login.idDigitsOnly"));
      return;
    }
    if (registerData.password.length < 12 || new TextEncoder().encode(registerData.password).length > 72) {
      toast.error(t("login.passwordMin"));
      return;
    }
    try {
      const { error } = await signUp({
        email,
        password: registerData.password,
        firstName,
        surname,
        idNumber,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      const profile = await refresh();
      if (!profile) {
        toast.error(t("login.profileLoadFailed"));
        return;
      }
      toast.success(t("login.registerSuccess"));
      navigate(profile?.role === "admin" ? "/admin" : "/portal");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("login.back")}
          </Button>
          <LanguageSwitcher />
        </div>

        <Card className="p-8 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">{t("login.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("login.subtitle")}</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t("login.login")}</TabsTrigger>
              <TabsTrigger value="register">{t("login.register")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-id-number">{t("login.idNumber")}</Label>
                  <Input
                    id="login-id-number"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{1,32}"
                    maxLength={32}
                    autoComplete="off"
                    required
                    value={loginData.idNumber}
                    onChange={(e) => setLoginData({ ...loginData, idNumber: e.target.value })}
                    placeholder={t("login.idNumberPlaceholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">{t("login.password")}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder={t("login.passwordPlaceholder")}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <LogIn className="mr-2 h-4 w-4" />
                  {t("login.login")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">{t("login.firstName")}</Label>
                    <Input
                      id="first-name"
                      autoComplete="given-name"
                      maxLength={100}
                      required
                      value={registerData.firstName}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, firstName: e.target.value })
                      }
                      placeholder={t("login.firstNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="surname">{t("login.surname")}</Label>
                    <Input
                      id="surname"
                      autoComplete="family-name"
                      maxLength={100}
                      required
                      value={registerData.surname}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, surname: e.target.value })
                      }
                      placeholder={t("login.surnamePlaceholder")}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="id-number">{t("login.idNumber")}</Label>
                  <Input
                    id="id-number"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{1,32}"
                    maxLength={32}
                    autoComplete="off"
                    required
                    value={registerData.idNumber}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, idNumber: e.target.value })
                    }
                    placeholder={t("login.idNumberPlaceholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="register-email">{t("login.email")}</Label>
                  <Input
                    id="register-email"
                    type="email"
                    maxLength={320}
                    autoComplete="email"
                    required
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">{t("login.password")}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, password: e.target.value })
                    }
                    placeholder={t("login.passwordCreate")}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t("login.register")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Login;
