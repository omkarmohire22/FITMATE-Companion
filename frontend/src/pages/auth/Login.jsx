import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../utils/api";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  Dumbbell,
  Sparkles,
  Heart,
  Activity,
  Users,
  ArrowRight,
  CheckCircle,
  Shield,
  TrendingUp,
  Zap,
  Star,
  HelpCircle,
  Check
} from "lucide-react";

import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [rememberMe, setRememberMe] = useState(true);
  const [emailValid, setEmailValid] = useState(true);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const slides = [
    {
      icon: <Activity className="w-8 h-8" />,
      text: "Track your progress with AI-powered analytics",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      text: "Personalized workout plans for your goals",
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: <Users className="w-8 h-8" />,
      text: "Join 50,000+ fitness enthusiasts",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const features = [
    { icon: <TrendingUp className="w-5 h-5" />, text: "Real-time Progress Tracking" },
    { icon: <Zap className="w-5 h-5" />, text: "AI-Powered Recommendations" },
    { icon: <Star className="w-5 h-5" />, text: "Expert Trainer Support" },
  ];

  useEffect(() => {
    const savedEmail = localStorage.getItem('fitmate_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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

  useEffect(() => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(email === '' || emailRegex.test(email));
  }, [email]);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !emailValid) return;

    // Save email if remember me is checked
    if (rememberMe && email) {
      localStorage.setItem('fitmate_remember_email', email);
    } else {
      localStorage.removeItem('fitmate_remember_email');
    }

    setLoading(true);
    setError("");

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      if (!result.success) throw new Error(result.error);

      // Show success feedback
      setLoginSuccess(true);
      
      setTimeout(() => {
        if (result.user.role === "admin") navigate("/admin");
        else if (result.user.role === "trainer") navigate("/trainer");
        else navigate("/trainee");
      }, 800);
    } catch (err) {
      const errorMsg = err.message?.toLowerCase() || "";
      if (errorMsg.includes("password") || errorMsg.includes("credential")) {
        setError("Incorrect password. Please try again.");
      } else if (errorMsg.includes("not found") || errorMsg.includes("email")) {
        setError("No account found with this email address.");
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      {/* ANIMATED BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-full blur-[120px] animate-pulse"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-[120px] animate-pulse"
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px] animate-gradient-slow" />
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

      {/* ROLE BUTTONS */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 sm:gap-3 z-20 animate-fade-in">
        <button
          onClick={() => navigate("/admin-login")}
          className="group flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-red-500/20 text-red-300 rounded-xl border border-red-500/30 hover:bg-red-500/30 hover:border-red-400/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 active:scale-95 text-xs sm:text-sm"
        >
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
          <span className="font-medium hidden xs:inline">Admin</span>
        </button>
        <button
          onClick={() => navigate("/trainer-login")}
          className="group flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-400/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 text-xs sm:text-sm"
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
          <span className="font-medium hidden xs:inline">Trainer</span>
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row gap-6 sm:gap-8 items-center px-4 sm:px-6">
        
        {/* LEFT SIDE — FEATURE SHOWCASE */}
        <div className="hidden lg:flex lg:flex-1 flex-col gap-8 animate-slide-up">
          {/* HERO SECTION */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full backdrop-blur-sm animate-bounce-slow">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">Trusted by 50,000+ Users</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Transform Your
              <span className="block bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
                Fitness Journey
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 leading-relaxed max-w-xl">
              Join the ultimate fitness platform powered by AI. Track, train, and transform with personalized guidance.
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
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  {feature.icon}
                </div>
                <span className="text-white font-medium">{feature.text}</span>
                <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
              </div>
            ))}
          </div>

          {/* CAROUSEL */}
          <div className="relative h-32 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex items-center gap-6 px-8 transition-all duration-700 ${
                  index === currentSlide
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-full"
                }`}
              >
                <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${slide.color} rounded-2xl shadow-lg`}>
                  {slide.icon}
                </div>
                <p className="text-white text-lg font-medium flex-1">{slide.text}</p>
              </div>
            ))}
            
            {/* DOTS */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? "bg-white w-8" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — LOGIN FORM */}
        <div className="w-full lg:flex-1 max-w-md animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {/* LOGO HEADER */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-2xl sm:rounded-3xl shadow-2xl shadow-green-500/30 mb-3 sm:mb-4 animate-bounce-slow">
              <Dumbbell className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-1.5 sm:mb-2">Welcome Back</h2>
            <p className="text-slate-400 text-sm sm:text-base">Sign in to continue your fitness journey</p>
          </div>

          {/* LOGIN CARD */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl hover:shadow-green-500/10 transition-shadow duration-500">
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
                  <Mail className="w-3.5 h-3.5 text-green-400" />
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                    focusedField === "email" ? "text-green-400 scale-110" : "text-slate-500"
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
                    aria-label="Email address"
                    aria-describedby="email-error"
                    aria-invalid={email && !emailValid}
                    className={`w-full bg-white/5 border rounded-xl py-3.5 pl-12 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/10 text-sm sm:text-base ${
                      focusedField === "email" ? "border-green-500/50 shadow-lg shadow-green-500/10" : email && !emailValid ? "border-red-500/50" : "border-gray-600"
                    }`}
                    placeholder="Enter your email address"
                    required
                  />
                  {email && emailValid && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400 animate-scale-in" />
                  )}
                </div>
                {email && !emailValid && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Please enter a valid email address
                  </p>
                )}
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-2">
                <label className="text-slate-300 text-xs sm:text-sm font-medium block flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-green-400" />
                  Password
                </label>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    focusedField === "password" ? "text-green-400" : "text-slate-500"
                  }`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    autoComplete="current-password"
                    disabled={loading}
                    className={`w-full bg-white/5 border rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      focusedField === "password" ? "border-green-500/50" : "border-gray-600"
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-slate-500 text-xs mt-1">Minimum 8 characters required</p>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading || loginSuccess || !emailValid || !email || !password}
                aria-label="Sign in to your account"
                className={`group w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  loginSuccess
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/50"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.02] active:scale-[0.98]"
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
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* FOOTER */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                Need an account?{" "}
                <span className="text-green-400 font-medium">
                  Contact your trainer or admin
                </span>
              </p>
            </div>
          </div>

          {/* TRUST BADGE */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Shield className="w-4 h-4" />
            <span>Secured with enterprise-grade encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
