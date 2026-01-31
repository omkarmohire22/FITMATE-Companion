import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../utils/api";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  Shield,
  Crown,
  Sparkles,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  BarChart3,
  Zap,
  Star,
  Check,
} from "lucide-react";

import "./Login.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [emailValid, setEmailValid] = useState(true);

  const features = [
    { icon: <Users className="w-5 h-5" />, text: "User Management" },
    { icon: <BarChart3 className="w-5 h-5" />, text: "System Analytics" },
    { icon: <CheckCircle className="w-5 h-5" />, text: "Platform Control" },
  ];

  // Auto redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && user.role === "ADMIN") {
      navigate("/admin");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(email === '' || emailRegex.test(email));
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    if (!otpStep) {
      try {
        const res = await authApi.adminSendOtp({ email: email.trim(), password });
        if (res.data && res.data.message) {
          setOtpStep(true);
          setPassword("");
          setError("");
        } else {
          throw new Error(res.data?.message || "Failed to send OTP");
        }
      } catch (err) {
        const errorMsg = err.response?.data?.detail || err.message || "";
        if (errorMsg.toLowerCase().includes("password")) {
          setError("Incorrect password.");
        } else if (errorMsg.toLowerCase().includes("not found")) {
          setError("Admin account not found.");
        } else if (errorMsg.toLowerCase().includes("network")) {
          setError("Network error.");
        } else {
          setError(errorMsg || "Invalid credentials.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const res = await authApi.adminVerifyOtp({ email: email.trim(), otp });
        if (res.data && res.data.access_token) {
          localStorage.setItem("access_token", res.data.access_token);
          if (res.data.refresh_token) {
            localStorage.setItem("refresh_token", res.data.refresh_token);
          }
          setLoginSuccess(true);
          setTimeout(() => {
            window.location.href = "/admin";
          }, 800);
          return;
        }
        throw new Error(res.data?.message || "Invalid OTP");
      } catch (err) {
        const errorMsg = err.response?.data?.detail || err.message || "";
        setError(errorMsg || "Verification failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-slate-50 dark:bg-slate-50 overflow-hidden font-sans text-slate-900 dark:text-slate-900 selection:bg-rose-100 selection:text-rose-900">

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-100/40 rounded-full blur-[100px] opacity-50 -translate-y-1/2 translate-x-1/4 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/40 rounded-full blur-[100px] opacity-50 translate-y-1/2 -translate-x-1/4 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-orange-100/40 rounded-full blur-[100px] opacity-40 -translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3 animate-fade-in">
        <button
          onClick={() => navigate("/login")}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-white/80 border border-slate-200 dark:border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-slate-700 group-hover:text-rose-600" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-800 group-hover:text-slate-950 dark:group-hover:text-slate-950">Back</span>
        </button>
        <button
          onClick={() => navigate("/trainer-login")}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-white/80 border border-slate-200 dark:border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 backdrop-blur-sm"
        >
          <Users className="w-4 h-4 text-slate-700 dark:text-slate-700 group-hover:text-rose-600" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-800 group-hover:text-slate-950 dark:group-hover:text-slate-950">Trainer</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 p-6 items-center">

        {/* Left Column: Admin Value Prop */}
        <div className="hidden lg:flex flex-col justify-center space-y-10 animate-slide-up">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-rose-50/80 dark:bg-rose-50/80 border border-rose-100 dark:border-rose-100 rounded-full w-fit backdrop-blur-sm shadow-sm">
              <Crown className="w-4 h-4 text-rose-600 dark:text-rose-600" />
              <span className="text-rose-900 dark:text-rose-900 text-xs font-extrabold uppercase tracking-wider">Restricted Access</span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-black tracking-tight text-slate-950 dark:text-slate-950 leading-[1.1]">
              Administrative<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600">
                Control Panel
              </span>
            </h1>

            <p className="text-lg text-slate-700 dark:text-slate-700 max-w-lg leading-relaxed font-bold">
              Complete oversight of your fitness platform. Manage users, analyze performance, and maintain system integrity from one secure location.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-white/60 dark:bg-white/60 border border-slate-100 dark:border-slate-100 rounded-2xl shadow-sm backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-rose-100 to-orange-50 rounded-full text-rose-600 dark:text-rose-600 shadow-inner">
                  {feature.icon}
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-800">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Security Note */}
          <div className="bg-white/80 dark:bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-100 flex items-center gap-5">
            <div className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-100 rounded-xl text-slate-600 dark:text-slate-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-slate-950 dark:text-slate-950">Secure Environment</p>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-600 mt-0.5">Two-Factor Authentication Required</p>
            </div>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="w-full max-w-md mx-auto animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="bg-white dark:bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-slate-100 p-8 sm:p-10 relative overflow-hidden ring-1 ring-slate-50 dark:ring-slate-50">

            <div className="mb-8 text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-rose-500 to-orange-600 rounded-2xl shadow-lg shadow-rose-200 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-4xl font-extrabold text-slate-950 dark:text-slate-950 tracking-tight leading-tight">Admin Portal</h2>
              <p className="text-slate-600 dark:text-slate-600 mt-3 text-base font-bold">Please verify your identity to continue.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-50/50 border border-red-100 dark:border-red-100 rounded-xl flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-600 font-semibold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-950 dark:text-slate-950 ml-1 block">Admin Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`w-5 h-5 transition-colors duration-200 ${focusedField === "email" ? "text-rose-600 dark:text-rose-600" : "text-slate-500 dark:text-slate-500"}`} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    disabled={loading || otpStep}
                    className={`block w-full pl-11 pr-10 py-4 bg-slate-50 dark:bg-slate-50 border-2 rounded-xl text-slate-900 dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-white focus:ring-0 transition-all text-sm font-semibold ${focusedField === "email" ? "border-rose-500 shadow-[0_0_0_4px_rgba(225,29,72,0.1)]" : "border-slate-100 dark:border-slate-100 hover:border-slate-200"
                      } ${email && !emailValid ? "border-red-300 dark:border-red-300" : ""}`}
                    placeholder="admin@fitmate.com"
                    required
                  />
                  {email && emailValid && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>

              {!otpStep && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-950 dark:text-slate-950 ml-1 block">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className={`w-5 h-5 transition-colors duration-200 ${focusedField === "password" ? "text-rose-600 dark:text-rose-600" : "text-slate-500 dark:text-slate-500"}`} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField("")}
                      disabled={loading}
                      className={`block w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-50 border-2 rounded-xl text-slate-900 dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-white focus:ring-0 transition-all text-sm font-semibold ${focusedField === "password" ? "border-rose-500 shadow-[0_0_0_4px_rgba(225,29,72,0.1)]" : "border-slate-100 dark:border-slate-100 hover:border-slate-200"
                        }`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {otpStep && (
                <div className="space-y-3 animate-fade-in">
                  <label className="text-sm font-bold text-slate-950 dark:text-slate-950 ml-1 block">One-Time Password (OTP)</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      autoFocus
                      disabled={loading}
                      className="block w-full text-center py-4 bg-white dark:bg-white border-2 border-rose-300 dark:border-rose-300 rounded-xl text-2xl font-bold tracking-[0.5em] text-rose-700 dark:text-rose-700 focus:outline-none focus:border-rose-500 focus:shadow-[0_0_0_4px_rgba(225,29,72,0.1)] transition-all placeholder:text-rose-200 placeholder:tracking-normal"
                      placeholder="000000"
                      required
                    />
                  </div>
                  <p className="text-sm text-center text-slate-700 dark:text-slate-700 mt-3 font-semibold">Sent to {email}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || (!otpStep && !password) || (otpStep && !otp.length)}
                className={`w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-xl shadow-rose-500/20 text-base font-bold text-white transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 ${loginSuccess
                  ? "bg-green-500 cursor-default"
                  : "bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 hover:shadow-rose-500/40 active:scale-[0.98]"
                  } disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
              >
                {loginSuccess ? (
                  <span className="flex items-center gap-2 animate-pulse">
                    <CheckCircle className="w-5 h-5" />
                    Access Granted
                  </span>
                ) : loading ? (
                  <span className="flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    {otpStep ? "Verifying..." : "Processing..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {otpStep ? "Verify & Login" : "Send OTP Verification"}
                    {!otpStep && <ArrowRight className="w-5 h-5" />}
                  </span>
                )}
              </button>

              {otpStep && (
                <button
                  type="button"
                  onClick={() => { setOtpStep(false); setOtp(""); }}
                  className="w-full py-3 text-sm font-bold text-slate-600 hover:text-slate-700 transition-colors"
                >
                  Back to Password
                </button>
              )}

            </form>

            {/* Security Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-600 font-semibold uppercase tracking-wider">
              <Zap className="w-3 h-3 text-rose-600" />
              <span>Enterprise Encryption</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
