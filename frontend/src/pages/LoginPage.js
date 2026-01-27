import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_748ef24b-f1b0-4292-8fd8-756f578df920/artifacts/w50htqda_thecommons_Logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API}${endpoint}`, payload, {
        withCredentials: true,
      });

      toast.success(isLogin ? "Welcome back!" : "Account created!");
      navigate("/", { state: { user: response.data.user } });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-zinc-800">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="thecommons" className="h-10 w-10" />
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-white">
              thecommons.
            </h1>
            <p className="text-xs text-zinc-500">Growth OS</p>
          </div>
        </div>

        <div className="space-y-8">
          <blockquote className="text-2xl font-heading font-light text-white leading-relaxed">
            "The platform has transformed how we manage growth engagements.
            Clear visibility, better decisions."
          </blockquote>
          <div>
            <p className="text-white font-medium">Growth Operations Lead</p>
            <p className="text-zinc-500 text-sm">Fortune 500 Marketing Team</p>
          </div>
        </div>

        <div className="text-xs text-zinc-600">
          © {new Date().getFullYear()} thecommons. All rights reserved.
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <img src={LOGO_URL} alt="thecommons" className="h-10 w-10" />
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight text-white">
                thecommons.
              </h1>
              <p className="text-xs text-zinc-500">Growth OS</p>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="font-heading text-3xl font-bold text-white">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="mt-2 text-zinc-500">
              {isLogin
                ? "Sign in to access your dashboard"
                : "Get started with your growth journey"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-400">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-black border-zinc-800 focus:border-white h-12"
                  placeholder="Enter your name"
                  required={!isLogin}
                  data-testid="name-input"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-black border-zinc-800 focus:border-white h-12"
                placeholder="Enter your email"
                required
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-400">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-black border-zinc-800 focus:border-white h-12"
                placeholder="Enter your password"
                required
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-zinc-200 rounded-full h-12 font-medium"
              disabled={loading}
              data-testid="submit-button"
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-4 text-zinc-600">OR</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full border-zinc-800 hover:bg-zinc-900 rounded-full h-12"
            data-testid="google-login-button"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-zinc-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-white hover:underline"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 border border-zinc-800 rounded-sm">
            <p className="text-xs text-zinc-500 mb-2">Demo Credentials:</p>
            <p className="text-xs text-zinc-400">
              Admin: admin@thecommons.io / admin123
            </p>
            <p className="text-xs text-zinc-400">
              Client: client@acme.com / client123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
