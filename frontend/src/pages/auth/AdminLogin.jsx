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
  TrendingUp,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  BarChart3,
  Zap,
  Star,
} from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  const features = [
    { icon: <Users className="w-5 h-5" />, text: "Manage Trainers & Members" },
    { icon: <BarChart3 className="w-5 h-5" />, text: "Analytics & Reports" },
    { icon: <CheckCircle className="w-5 h-5" />, text: "Complete Gym Control" },
  ];

  // Auto redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && user.role === "ADMIN") {
      navigate("/admin");
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
    setLoading(true);
    setError("");

    if (!otpStep) {
      try {
        // Step 1: Send OTP after password verification
        const res = await authApi.adminSendOtp({ email: email.trim(), password });
        if (res.data && res.data.message) {
          // OTP sent successfully, move to OTP verification step
          setOtpStep(true);
          setPassword(""); // Clear password for security
          setError("");
        } else {
          throw new Error(res.data?.message || "Failed to send OTP");
        }
      } catch (err) {
        const errorMsg = err.response?.data?.detail || err.message || "";
        if (errorMsg.toLowerCase().includes("password")) {
          setError("Incorrect password. Please try again.");
        } else if (errorMsg.toLowerCase().includes("not found") || errorMsg.toLowerCase().includes("email")) {
          setError("No admin account found with this email.");
        } else if (errorMsg.toLowerCase().includes("network")) {
          setError("Network error. Please check your connection.");
        } else {
          setError(errorMsg || "Invalid admin credentials. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Step 2: Verify OTP and complete login
      try {
        const res = await authApi.adminVerifyOtp({ email: email.trim(), otp });
        if (res.data && res.data.access_token) {
          localStorage.setItem("access_token", res.data.access_token);
          if (res.data.refresh_token) {
            localStorage.setItem("refresh_token", res.data.refresh_token);
          }
          // Show success feedback
          setLoginSuccess(true);
          setTimeout(() => {
            window.location.href = "/admin";
          }, 800);
          return;
        }
        throw new Error(res.data?.message || "Invalid OTP");
      } catch (err) {
        const errorMsg = err.response?.data?.detail || err.message || "";
        if (errorMsg.toLowerCase().includes("expired")) {
          setError("OTP has expired. Please request a new one.");
        } else if (errorMsg.toLowerCase().includes("invalid")) {
          setError("Invalid OTP. Please check and try again.");
        } else {
          setError(errorMsg || "Verification failed. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 py-8 px-4">
      {/* ANIMATED BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-red-500/30 to-orange-500/20 rounded-full blur-[120px] animate-pulse"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-[120px] animate-pulse"
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[150px]" />
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
          onClick={() => navigate("/trainer-login")}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm"
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="font-medium hidden xs:inline">Trainer</span>
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
        
        {/* LEFT SIDE — ADMIN INFO */}
        <div className="hidden lg:flex lg:flex-1 flex-col gap-8 animate-slide-up">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full backdrop-blur-sm animate-bounce-slow">
              <Crown className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm font-medium">Supreme Access Control</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Elite Admin
              <span className="block bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent animate-gradient">
                Control Panel
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 leading-relaxed max-w-xl">
              Manage your entire fitness empire. Complete control over trainers, members, billing, and operations.
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
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                  {feature.icon}
                </div>
                <span className="text-white font-medium">{feature.text}</span>
                <CheckCircle className="w-5 h-5 text-red-400 ml-auto" />
              </div>
            ))}
          </div>

          {/* INFO BOX */}
          <div className="relative h-32 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden p-6 flex items-center gap-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white text-lg font-bold mb-1">Authorized Personnel Only</p>
              <p className="text-slate-400 text-sm">Admin access requires elevated credentials</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — LOGIN FORM */}
        <div className="w-full lg:flex-1 max-w-md animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {/* LOGO HEADER */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-2xl sm:rounded-3xl shadow-2xl shadow-red-500/30 mb-3 sm:mb-4 animate-bounce-slow">
              <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-red-600" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-1.5 sm:mb-2">Admin Portal</h2>
            <p className="text-slate-400 text-sm sm:text-base">Secure access for administrators</p>
          </div>

          {/* LOGIN CARD */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl hover:shadow-red-500/10 transition-shadow duration-500">
            {error && (
              <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/50 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 animate-shake text-sm">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{typeof error === 'string' ? error : error?.message || JSON.stringify(error)}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* EMAIL FIELD */}
              <div className="space-y-2">
                <label className="text-slate-300 text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-red-400" />
                  Admin Email
                </label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                    focusedField === "email" ? "text-red-400 scale-110" : "text-slate-500"
                  }`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    disabled={loading || otpStep}
                    autoFocus
                    autoComplete="email"
                    aria-label="Admin email address"
                    className={`w-full bg-white/5 border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/10 text-sm sm:text-base ${
                      focusedField === "email" ? "border-red-500/50 shadow-lg shadow-red-500/10" : "border-gray-600"
                    }`}
                    placeholder="Enter your admin email"
                    required
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              {!otpStep && (
                <div className="space-y-2">
                  <label className="text-slate-300 text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    Admin Password
                  </label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                      focusedField === "password" ? "text-red-400 scale-110" : "text-slate-500"
                    }`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField("")}
                      disabled={loading}
                      autoComplete="current-password"
                      className={`w-full bg-white/5 border rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/10 text-sm sm:text-base ${
                        focusedField === "password" ? "border-red-500/50 shadow-lg shadow-red-500/10" : "border-gray-600"
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">Use your secure admin password</p>
                </div>
              )}

              {/* OTP FIELD */}
              {otpStep && (
                <div className="space-y-2">
                  <label className="text-slate-300 text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-orange-400" />
                    Enter OTP
                  </label>
                  <p className="text-slate-400 text-xs sm:text-sm mb-3">
                    A 6-digit code has been sent to <span className="text-white font-semibold">{email}</span>
                  </p>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={loading}
                    autoFocus
                    maxLength={6}
                    className="w-full bg-white/5 border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/10 text-sm sm:text-base border-orange-500/50 shadow-lg shadow-orange-500/10"
                    placeholder="Enter 6-digit OTP"
                    required
                  />
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading || loginSuccess || !email || (!otpStep && !password) || (otpStep && !otp)}
                aria-label={otpStep ? "Verify OTP" : "Send OTP to email"}
                className={`group w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  loginSuccess
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30"
                    : "bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-red-500/30 hover:shadow-red-500/50 disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {loginSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 animate-bounce" />
                    <span>Access Granted!</span>
                  </>
                ) : loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>{otpStep ? "Verifying..." : "Sending OTP..."}</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>{otpStep ? "Verify & Sign In" : "Send OTP"}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* BACK BUTTON (OTP STEP ONLY) */}
              {otpStep && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setOtp("");
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-base bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Email & Password
                </button>
              )}
            </form>

            {/* FOOTER */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Authorized personnel only
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

export default AdminLogin;
