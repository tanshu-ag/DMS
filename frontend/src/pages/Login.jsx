import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const Login = () => {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleLogin = () => {
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
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
              CR APPOINTMENT<br />SYSTEM
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Customer Relationship Department Portal
            </p>
          </div>

          <div className="border border-gray-200 p-8">
            <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-6 text-center">
              Sign in to continue
            </p>
            
            <Button
              onClick={handleLogin}
              className="w-full bg-black text-white hover:bg-gray-800 rounded-sm font-mono text-xs uppercase tracking-wider h-12"
              data-testid="login-button"
            >
              <LogIn className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Sign in with Google
            </Button>

            <p className="text-[10px] text-gray-400 mt-6 text-center">
              Access restricted to authorized Bohania Renault staff only.
            </p>
          </div>

          {/* Role Info */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 border border-gray-100">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">CRE</p>
              <p className="text-xs text-gray-600">Appointments</p>
            </div>
            <div className="p-4 border border-gray-100">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">Reception</p>
              <p className="text-xs text-gray-600">Day Outcomes</p>
            </div>
            <div className="p-4 border border-gray-100">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">CRM</p>
              <p className="text-xs text-gray-600">Full Access</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 p-4 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
          © 2026 Bohania Renault — Service Excellence
        </p>
      </footer>
    </div>
  );
};

export default Login;
