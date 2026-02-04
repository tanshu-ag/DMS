import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/auth/login`,
        formData,
        { withCredentials: true }
      );

      toast.success(`Welcome, ${response.data.name}`);
      navigate("/dashboard", { replace: true, state: { user: response.data } });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="login-page">
      {/* Header */}
      <header className="border-b border-gray-200 p-6">
        <h1 className="font-heading font-black text-2xl tracking-tighter uppercase">
          BOHANIA RENAULT
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-12">
            <h2 className="font-heading font-black text-4xl md:text-5xl tracking-tighter uppercase mb-4">
              DEALER<br />MANAGEMENT<br />SYSTEM
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Enterprise Portal for Authorized Dealers
            </p>
          </div>

          <Card className="border border-gray-200 rounded-sm shadow-none">
            <CardContent className="p-8">
              <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-6 text-center">
                Sign in to continue
              </p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Username
                  </Label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                    className="rounded-sm"
                    autoComplete="username"
                    data-testid="input-username"
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      className="rounded-sm pr-10"
                      autoComplete="current-password"
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 rounded-sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-sm font-mono text-xs uppercase tracking-wider h-12 mt-6"
                  disabled={loading}
                  data-testid="login-button"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <p className="text-[10px] text-gray-400 mt-6 text-center">
                Access restricted to authorized Bohania Renault staff only.
              </p>
            </CardContent>
          </Card>

          {/* Role Info */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 border border-gray-100 rounded-sm">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">CRE</p>
              <p className="text-xs text-gray-600">Appointments</p>
            </div>
            <div className="p-4 border border-gray-100 rounded-sm">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">Reception</p>
              <p className="text-xs text-gray-600">Day Outcomes</p>
            </div>
            <div className="p-4 border border-gray-100 rounded-sm">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">Admin</p>
              <p className="text-xs text-gray-600">Full Access</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 p-4 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
          2026 Bohania Renault - Service Excellence
        </p>
      </footer>
    </div>
  );
};

export default Login;
