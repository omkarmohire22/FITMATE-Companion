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
} from "lucide-react";

const TrainerLogin = () => {
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const features = [
    { icon: <Users className="w-5 h-5" />, text: "Manage Your Trainees" },
    { icon: <Target className="w-5 h-5" />, text: "Track Progress & Goals" },
    { icon: <Award className="w-5 h-5" />, text: "AI-Powered Insights" },
  ];

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('fitmate_trainer_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Auto redirect if already logged in as trainer
  useEffect(() => {
    if (!authLoading && user && user.role === "TRAINER") {
      navigate("/trainer");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Save or remove email based on remember me
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

      // Check if user is trainer
      if (result.user.role !== "TRAINER") {
        throw new Error("Access denied. This portal is exclusively for trainers.");
      }

      // Show success feedback before redirect
      setLoginSuccess(true);
      setTimeout(() => navigate("/trainer"), 800);
    } catch (err) {
      const errorMsg = err.message?.toLowerCase() || "";
      if (errorMsg.includes("password") || errorMsg.includes("credential")) {
        setError("Incorrect password. Please try again.");
      } else if (errorMsg.includes("not found") || errorMsg.includes("email")) {
        setError("No trainer account found with this email.");
      } else if (errorMsg.includes("network")) {
        setError("Network error. Please check your connection.");
      } else {
        setError(err.message || "Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
      {/* ANIMATED BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-500/30 to-cyan-500/20 rounded-full blur-[120px] animate-pulse"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-[120px] animate-pulse"
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]" />
      </div>

      {/* FLOATING PARTICLES */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/login")}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium hidden xs:inline">Back</span>
      </button>

      {/* ROLE BUTTONS */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 sm:gap-3 z-20">
        <button
          onClick={() => navigate("/admin-login")}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-red-500/20 text-red-300 rounded-xl border border-red-500/30 hover:bg-red-500/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm"
        >
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="font-medium hidden xs:inline">Admin</span>
        </button>
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-green-500/20 text-green-300 rounded-xl border border-green-500/30 hover:bg-green-500/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm"
        >
          <span className="font-medium hidden xs:inline">Trainee</span>
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row gap-6 sm:gap-8 items-center px-4 sm:px-6">
        
        {/* LEFT SIDE — TRAINER INFO */}
        <div className="hidden lg:flex lg:flex-1 flex-col gap-8 animate-slide-up">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full backdrop-blur-sm animate-bounce-slow">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Professional Coaching Portal</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Trainer
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
                Dashboard
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 leading-relaxed max-w-xl">
              Empower your trainees with AI-powered coaching tools. Track progress, set goals, and achieve results together.
            </p>
          </div>

          {/* FEATURE CARDS */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                  {feature.icon}
                </div>
                <span className="text-white font-medium">{feature.text}</span>
                <CheckCircle className="w-5 h-5 text-blue-400 ml-auto" />
              </div>
            ))}
          </div>

          {/* INFO BOX */}
          <div className="relative h-32 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden p-6 flex items-center gap-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white text-lg font-bold mb-1">Coach with Confidence</p>
              <p className="text-slate-400 text-sm">AI-powered tools to help your trainees succeed</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — LOGIN FORM */}
        <div className="w-full lg:flex-1 max-w-md animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {/* LOGO HEADER */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-500/30 mb-3 sm:mb-4 animate-bounce-slow">
              <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-1.5 sm:mb-2">Trainer Portal</h2>
            <p className="text-slate-400 text-sm sm:text-base">Sign in to manage your trainees</p>
          </div>

          {/* LOGIN CARD */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl hover:shadow-blue-500/10 transition-shadow duration-500">
            {error && (
              <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/50 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 animate-shake text-sm">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{typeof error === 'string' ? error : error?.message || JSON.stringify(error)}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* EMAIL FIELD */}
              <div className="space-y-2">
                <label className="text-slate-300 text-xs sm:text-sm font-medium block flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  Trainer Email
                </label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                    focusedField === "email" ? "text-blue-400 scale-110" : "text-slate-500"
                  }`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    disabled={loading}
                    autoFocus
                    autoComplete="email"
                    aria-label="Trainer email address"
                    aria-describedby="email-hint"
                    className={`w-full bg-white/5 border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/10 text-sm sm:text-base ${
                      focusedField === "email" ? "border-blue-500/50 shadow-lg shadow-blue-500/10" : "border-gray-600"
                    }`}
                    placeholder="Enter your trainer email"
                    required
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-2">
                <label className="text-slate-300 text-xs sm:text-sm font-medium block flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  Password
                </label>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                    focusedField === "password" ? "text-blue-400 scale-110" : "text-slate-500"
                  }`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    disabled={loading}
                    autoComplete="current-password"
                    className={`w-full bg-white/5 border rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/10 text-sm sm:text-base ${
                      focusedField === "password" ? "border-blue-500/50 shadow-lg shadow-blue-500/10" : "border-gray-600"
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-slate-500 text-xs mt-1">Minimum 8 characters required</p>
              </div>

              {/* REMEMBER ME */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-white/5 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"
                    aria-label="Remember my email"
                  />
                  <span className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Remember me</span>
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading || loginSuccess || !email || !password}
                aria-label="Sign in to trainer portal"
                className={`group w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  loginSuccess
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30"
                    : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {loginSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 animate-bounce" />
                    <span>Welcome Back!</span>
                  </>
                ) : loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-5 h-5" />
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* FOOTER */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                Need trainer access?{" "}
                <span className="text-blue-400 font-medium">
                  Contact your admin
                </span>
              </p>
            </div>
          </div>

          {/* TRUST BADGE */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Zap className="w-4 h-4" />
            <span>Secured with enterprise-grade encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerLogin;