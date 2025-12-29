import { createContext, useContext, useEffect, useState } from "react";
import { authApi, clearCache } from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [loading, setLoading] = useState(true);

  /* ------------------------------------
      AUTO PROFILE LOAD ON REFRESH
  -------------------------------------*/
  useEffect(() => {
    if (token) fetchProfile();
    else setLoading(false);
  }, [token]);

  /* ------------------------------------
          FETCH USER PROFILE
  -------------------------------------*/
  const fetchProfile = async () => {
    try {
      const res = await authApi.getProfile();
      const profile = res?.data?.user || res?.data;

      if (!profile) throw new Error("Invalid profile response");

      // 🔥 ALWAYS force uppercase roles
      const normalized = {
        ...profile,
        role: profile.role?.toUpperCase()
      };

      setUser(normalized);
    } catch (error) {
      console.error("❌ Profile Error:", error);
      forceLogout();
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------
           NORMAL USER LOGIN
  -------------------------------------*/
  const login = async (credentials) => {
    try {
      const res = await authApi.login(credentials);
      let { access_token, refresh_token, user } = res.data;

      // 🔥 Normalize role
      user = { ...user, role: user.role?.toUpperCase() };

      if (!access_token || !user)
        throw new Error("Invalid login response from server");

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token || "");

      setToken(access_token);
      setUser(user);

      toast.success("Login successful");
      return { success: true, user };
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Invalid login credentials";

      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ------------------------------------
              ADMIN LOGIN
  -------------------------------------*/
  const adminLogin = async ({ email, password }) => {
    try {
      const res = await authApi.adminLogin({ email, password });
      let { access_token, refresh_token, user } = res.data;

      // 🔥 Normalize role
      user = { ...user, role: user.role?.toUpperCase() };

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token || "");

      setToken(access_token);
      setUser(user);

      toast.success("Admin login successful");
      return { success: true, user };
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Admin login failed";

      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ------------------------------------
               REGISTER
  -------------------------------------*/
  const register = async (payload) => {
    try {
      const res = await authApi.register(payload);
      toast.success("Registration successful");
      return { success: true, data: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Registration failed";

      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ------------------------------------
               LOGOUT
  -------------------------------------*/
  const logout = () => {
    clearCache(); // Clear API cache on logout
    localStorage.clear();
    setUser(null);
    setToken(null);
    toast.success("Logged out");
    window.location.href = "/login";
  };

  const forceLogout = () => {
    clearCache(); // Clear API cache on logout
    localStorage.clear();
    setUser(null);
    setToken(null);
    toast.error("Session expired. Please login again.");
    window.location.href = "/login";
  };

  /* ------------------------------------
              EXPORT CONTEXT
  -------------------------------------*/
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    adminLogin,
    register,
    logout,
    forceLogout,
    refreshProfile: fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
