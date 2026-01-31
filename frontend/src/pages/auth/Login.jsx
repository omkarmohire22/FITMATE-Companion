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
  const [rememberMe, setRememberMe] = useState(true);
  const [emailValid, setEmailValid] = useState(true);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const slides = [
    {
      icon: <Activity className="w-6 h-6" />,
      text: "Track progress with advanced analytics",
      color: "bg-blue-600",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      text: "Personalized plans tailored to you",
      color: "bg-rose-500",
    },
    {
      icon: <Users className="w-6 h-6" />,
      text: "Connect with a supportive community",
      color: "bg-emerald-500",
    },
  ];

  const features = [
    { icon: <TrendingUp className="w-5 h-5" />, text: "Real-time Tracking" },
    { icon: <Zap className="w-5 h-5" />, text: "Smart Recommendations" },
    { icon: <Star className="w-5 h-5" />, text: "Expert Guidance" },
  ];

  useEffect(() => {
    const savedEmail = localStorage.getItem('fitmate_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(email === '' || emailRegex.test(email));
  }, [email]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !emailValid) return;

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

      setLoginSuccess(true);

      setTimeout(() => {
        if (result.user.role === "admin") navigate("/admin");
        else if (result.user.role === "trainer") navigate("/trainer");
        else navigate("/trainee");
      }, 800);
    } catch (err) {
      const errorMsg = err.message?.toLowerCase() || "";
      if (errorMsg.includes("password") || errorMsg.includes("credential")) {
        setError("Incorrect password entered.");
      } else if (errorMsg.includes("not found") || errorMsg.includes("email")) {
        setError("Account not found.");
      } else if (errorMsg.includes("network")) {
        setError("Network error. Check connection.");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gray-50 dark:bg-gray-50 overflow-hidden font-sans text-gray-900 dark:text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-[100px] opacity-60 -translate-y-1/2 translate-x-1/4 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] opacity-60 translate-y-1/2 -translate-x-1/4 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-[100px] opacity-40 -translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-4000"></div>
      </div>

      {/* Role Navigation Buttons */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3 animate-fade-in">
        <button
          onClick={() => navigate("/admin-login")}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-white/80 border border-gray-200 dark:border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 backdrop-blur-sm"
        >
          <Shield className="w-4 h-4 text-gray-700 dark:text-gray-700 group-hover:text-emerald-600" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-800 group-hover:text-gray-950 dark:group-hover:text-gray-950">Admin</span>
        </button>
        <button
          onClick={() => navigate("/trainer-login")}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-white/80 border border-gray-200 dark:border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 backdrop-blur-sm"
        >
          <Users className="w-4 h-4 text-gray-700 dark:text-gray-700 group-hover:text-emerald-600" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-800 group-hover:text-gray-950 dark:group-hover:text-gray-950">Trainer</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 p-6 items-center">

        {/* Left Column: Value Proposition */}
        <div className="hidden lg:flex flex-col justify-center space-y-10 animate-slide-up">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/60 dark:bg-white/60 border border-emerald-100 dark:border-emerald-100 rounded-full w-fit backdrop-blur-md shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-600 fill-emerald-600" />
              <span className="text-emerald-900 dark:text-emerald-900 text-xs font-extrabold uppercase tracking-wider">Trusted by 50,000+ Users</span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-black tracking-tight text-gray-950 dark:text-gray-950 leading-[1.1]">
              Shape Your Body,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                Master Your Life.
              </span>
            </h1>

            <p className="text-lg text-gray-800 dark:text-gray-800 max-w-lg leading-relaxed font-bold">
              Experience the next evolution in fitness. Intelligent tracking, personalized coaching, and a community that moves with you.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-white/80 dark:bg-white/80 border border-emerald-100/50 dark:border-emerald-100/50 rounded-2xl shadow-sm backdrop-blur-sm hover:bg-white dark:hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full text-emerald-600 dark:text-emerald-600 shadow-inner">
                  {feature.icon}
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-900">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Carousel Widget */}
          <div className="bg-white/80 dark:bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-white/50 relative overflow-hidden h-32 flex items-center ring-1 ring-gray-100 dark:ring-gray-100">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 px-6 flex items-center gap-5 transition-all duration-700 ease-in-out ${index === currentSlide ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
                  }`}
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-white shadow-lg ${slide.color}`}>
                  {slide.icon}
                </div>
                <div>
                  <p className="font-extrabold text-gray-950 dark:text-gray-950 text-lg">{slide.text}</p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-700 mt-1 uppercase tracking-wide">Feature Highlight</p>
                </div>
              </div>
            ))}

            <div className="absolute bottom-4 right-6 flex gap-1.5">
              {slides.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "w-6 bg-emerald-600" : "w-1.5 bg-gray-300 dark:bg-gray-300"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="w-full max-w-md mx-auto animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="bg-white dark:bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-100 p-8 sm:p-10 relative overflow-hidden ring-1 ring-gray-50 dark:ring-gray-50">

            {/* Form Header */}
            <div className="mb-8 text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-200 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <Dumbbell className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-4xl font-extrabold text-gray-950 dark:text-gray-950 tracking-tight leading-tight">Welcome back</h2>
              <p className="text-gray-600 dark:text-gray-600 mt-3 text-base font-semibold">Please enter your details to sign in.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-50/50 border border-red-100 dark:border-red-100 rounded-xl flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-600 font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-950 dark:text-gray-950 ml-1 block">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`w-5 h-5 transition-colors duration-200 ${focusedField === "email" ? "text-emerald-600" : "text-gray-500 dark:text-gray-500"}`} />
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
                    className={`block w-full pl-11 pr-10 py-4 bg-gray-50 dark:bg-gray-50 border-2 rounded-xl text-gray-950 dark:text-gray-950 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-white focus:ring-0 transition-all text-sm font-semibold ${focusedField === "email" ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" : "border-gray-100 hover:border-gray-200 dark:border-gray-100"
                      } ${email && !emailValid ? "border-red-300 dark:border-red-300" : ""}`}
                    placeholder="name@company.com"
                    required
                  />
                  {email && emailValid && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-gray-950 dark:text-gray-950">Password</label>
                  <a href="#" className="text-xs font-bold text-emerald-700 dark:text-emerald-700 hover:text-emerald-800 transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`w-5 h-5 transition-colors duration-200 ${focusedField === "password" ? "text-emerald-600" : "text-gray-400 dark:text-gray-400"}`} />
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
                    className={`block w-full pl-11 pr-12 py-4 bg-gray-50 dark:bg-gray-50 border-2 rounded-xl text-gray-950 dark:text-gray-950 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-white focus:ring-0 transition-all text-sm font-semibold ${focusedField === "password" ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" : "border-gray-100 hover:border-gray-200 dark:border-gray-100"
                      }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 bg-gray-50 dark:bg-gray-50 cursor-pointer"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="remember-me" className="font-bold text-gray-700 dark:text-gray-700 cursor-pointer select-none hover:text-gray-950 transition-colors">Remember my device</label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !emailValid || !email || !password}
                className={`w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-xl shadow-emerald-500/20 text-base font-bold text-white transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${loginSuccess
                  ? "bg-emerald-500 cursor-default"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:shadow-emerald-500/40 active:scale-[0.98]"
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

            <div className="mt-8 text-center border-t border-gray-200 dark:border-gray-200 pt-6">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-700">
                Don't have an account?{" "}
                <span className="font-bold text-emerald-700 dark:text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer transition-colors">
                  Contact your trainer
                </span>
              </p>
            </div>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-600 font-bold uppercase tracking-wider">
              <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-600" />
              <span>Secure 256-bit Encryption</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
