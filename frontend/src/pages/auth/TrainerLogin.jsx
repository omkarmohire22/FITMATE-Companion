import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  Users,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Shield,
  Award,
  Dumbbell,
  Zap,
  Star,
  Check
} from "lucide-react";

import "./Login.css";

const TrainerLogin = () => {
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [emailValid, setEmailValid] = useState(true);

  const features = [
    { icon: <Users className="w-5 h-5" />, text: "Client Management" },
    { icon: <Target className="w-5 h-5" />, text: "Goal Tracking" },
    { icon: <Award className="w-5 h-5" />, text: "Performance Analytics" },
  ];

  useEffect(() => {
    const savedEmail = localStorage.getItem('fitmate_trainer_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && user.role === "TRAINER") {
      navigate("/trainer");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(email === '' || emailRegex.test(email));
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (rememberMe && email) {
      localStorage.setItem('fitmate_trainer_email', email);
    } else {
      localStorage.removeItem('fitmate_trainer_email');
    }

    setLoading(true);
    setError("");

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.user.role !== "TRAINER") {
        throw new Error("Access denied. Trainer portal only.");
      }

      setLoginSuccess(true);
      setTimeout(() => navigate("/trainer"), 800);
    } catch (err) {
      const errorMsg = err.message?.toLowerCase() || "";
      if (errorMsg.includes("password") || errorMsg.includes("credential")) {
        setError("Incorrect password.");
      } else if (errorMsg.includes("not found") || errorMsg.includes("email")) {
        setError("Trainer account not found.");
      } else if (errorMsg.includes("network")) {
        setError("Network error.");
      } else {
        setError(err.message || "Sign in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-slate-50 dark:bg-slate-50 overflow-hidden font-sans text-slate-900 dark:text-slate-900 selection:bg-blue-100 selection:text-blue-900">

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] opacity-60 -translate-y-1/2 translate-x-1/4 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-100/50 rounded-full blur-[100px] opacity-60 translate-y-1/2 -translate-x-1/4 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[100px] opacity-40 -translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3 animate-fade-in">
        <button
          onClick={() => navigate("/login")}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-white/80 border border-slate-200 dark:border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-slate-700 group-hover:text-blue-600" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-800 group-hover:text-slate-950 dark:group-hover:text-slate-950">Back</span>
        </button>
        <button
          onClick={() => navigate("/admin-login")}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-white/80 border border-slate-200 dark:border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 backdrop-blur-sm"
        >
          <Shield className="w-4 h-4 text-slate-700 dark:text-slate-700 group-hover:text-blue-600" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-800 group-hover:text-slate-950 dark:group-hover:text-slate-950">Admin</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 p-6 items-center">

        {/* Left Column: Trainer Value Prop */}
        <div className="hidden lg:flex flex-col justify-center space-y-10 animate-slide-up">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-blue-50/80 dark:bg-blue-50/80 border border-blue-100 dark:border-blue-100 rounded-full w-fit backdrop-blur-sm shadow-sm">
              <GraduationCap className="w-4 h-4 text-blue-700 dark:text-blue-700" />
              <span className="text-blue-900 dark:text-blue-900 text-xs font-extrabold uppercase tracking-wider">Professional Portal</span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-black tracking-tight text-slate-950 dark:text-slate-950 leading-[1.1]">
              Elevate Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600">
                Coaching Career
              </span>
            </h1>

            <p className="text-lg text-slate-700 dark:text-slate-700 max-w-lg leading-relaxed font-bold">
              The ultimate toolkit for modern fitness professionals. Manage clients, track progress, and deliver results with data-driven insights.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-white/60 dark:bg-white/60 border border-blue-100/50 dark:border-blue-100/50 rounded-2xl shadow-sm backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-50 rounded-full text-blue-700 dark:text-blue-700 shadow-inner">
                  {feature.icon}
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-800">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Stats Widget */}
          <div className="bg-white/80 dark:bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-blue-100 flex items-center gap-5">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-50 dark:bg-blue-50 rounded-xl text-blue-700 dark:text-blue-700">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-slate-950 dark:text-slate-950">Measure Impact</p>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-600 mt-0.5">Real-time performance metrics</p>
            </div>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="w-full max-w-md mx-auto animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="bg-white dark:bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-slate-200 p-8 sm:p-10 relative overflow-hidden ring-1 ring-slate-100 dark:ring-slate-100">

            <div className="mb-8 text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg shadow-blue-200 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <Dumbbell className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-4xl font-extrabold text-slate-950 dark:text-slate-950 tracking-tight leading-tight">Trainer Portal</h2>
              <p className="text-slate-600 dark:text-slate-600 mt-3 text-base font-semibold">Sign in to manage your trainees</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-50 border border-rose-100 dark:border-rose-100 rounded-xl flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-600 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700 dark:text-rose-700 font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-900 ml-1 block">Trainer Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`w-5 h-5 transition-colors duration-200 ${focusedField === "email" ? "text-blue-700 dark:text-blue-700" : "text-slate-500 dark:text-slate-500"}`} />
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
                    disabled={loading}
                    className={`block w-full pl-11 pr-10 py-4 bg-slate-50 dark:bg-slate-50 border-2 rounded-xl text-slate-900 dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-white focus:ring-0 transition-all text-sm font-semibold ${focusedField === "email" ? "border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]" : "border-slate-200 hover:border-slate-300 dark:border-slate-200"
                      } ${email && !emailValid ? "border-rose-300 dark:border-rose-300" : ""}`}
                    placeholder="trainer@fitmate.com"
                    required
                  />
                  {email && emailValid && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-900">Password</label>
                  <a href="#" className="text-xs font-bold text-blue-700 dark:text-blue-700 hover:text-blue-800 transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`w-5 h-5 transition-colors duration-200 ${focusedField === "password" ? "text-blue-700 dark:text-blue-700" : "text-slate-500 dark:text-slate-500"}`} />
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
                    className={`block w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-50 border-2 rounded-xl text-slate-900 dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-white focus:ring-0 transition-all text-sm font-semibold ${focusedField === "password" ? "border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]" : "border-slate-200 hover:border-slate-300 dark:border-slate-200"
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

              <div className="flex items-center pt-4">
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-700 dark:text-blue-700 border-gray-300 rounded focus:ring-blue-600 bg-slate-50 dark:bg-slate-50 cursor-pointer"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="remember-me" className="font-bold text-slate-700 dark:text-slate-700 cursor-pointer select-none hover:text-slate-900 transition-colors">Remember my device</label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className={`w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-xl shadow-blue-500/20 text-base font-bold text-white transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loginSuccess
                  ? "bg-emerald-500 cursor-default"
                  : "bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-800 hover:to-cyan-800 hover:shadow-blue-500/40 active:scale-[0.98]"
                  } disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
              >
                {loginSuccess ? (
                  <span className="flex items-center gap-2 animate-pulse">
                    <CheckCircle className="w-5 h-5" />
                    Success Redirecting...
                  </span>
                ) : loading ? (
                  <span className="flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-200 dark:border-slate-200 pt-6">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-600">
                Need an account?{" "}
                <span className="font-bold text-blue-700 dark:text-blue-700 hover:text-blue-800 hover:underline cursor-pointer transition-colors">
                  Contact Admin
                </span>
              </p>
            </div>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3 text-blue-600 dark:text-blue-600" />
              <span>Secure 256-bit Encryption</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerLogin;