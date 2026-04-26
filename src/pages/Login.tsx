import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { signIn, signUp } from "@/lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    firstName: "",
    surname: "",
    idNumber: "",
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const { error } = await signIn(loginData.email, loginData.password);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Login successful!");
      navigate("/profile-verification");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Object.values(registerData).every((val) => val)) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const { error } = await signUp(registerData.email, registerData.password, {
        first_name: registerData.firstName,
        surname: registerData.surname,
        id_number: registerData.idNumber,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Registration successful! Check email for confirmation if required.");
      navigate("/profile-verification");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Language Selection
        </Button>

        <Card className="p-8 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">NaTIS Portal</h1>
            <p className="text-muted-foreground mt-2">Access your learner's test</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email or ID Number</Label>
                  <Input
                    id="login-email"
                    type="text"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="Enter your email or ID"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Enter your password"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      value={registerData.firstName}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, firstName: e.target.value })
                      }
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="surname">Surname</Label>
                    <Input
                      id="surname"
                      value={registerData.surname}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, surname: e.target.value })
                      }
                      placeholder="Surname"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="id-number">ID Number</Label>
                  <Input
                    id="id-number"
                    value={registerData.idNumber}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, idNumber: e.target.value })
                    }
                    placeholder="Enter your ID number"
                  />
                </div>
                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, password: e.target.value })
                    }
                    placeholder="Create a password"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
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
