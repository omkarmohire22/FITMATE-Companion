/* ============================================================
   AXIOS BASE SETUP
============================================================ */

import axios from "axios";

// Backend URL - In development, use empty string to leverage Vite proxy
// In production, use the actual backend URL
export const API_URL = import.meta.env.VITE_API_URL || "";

// ============================================================
// CACHE LAYER - Prevent redundant API calls
// ============================================================
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

const getCacheKey = (url, method = 'GET') => `${method}:${url}`;

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return cached.data;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

export const clearCache = () => cache.clear();

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // Increased to 30 seconds for remote DB stability
});

/* ============================================================
   REQUEST INTERCEPTOR (Attach Token Correctly)
============================================================ */

api.interceptors.request.use(
  (config) => {
    const isAuthRoute =
      config.url.includes("/auth/login") ||
      config.url.includes("/auth/admin/login") ||
      config.url.includes("/auth/refresh");

    // Attach token only for protected routes
    if (!isAuthRoute) {
      const token = localStorage.getItem("access_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    // Check cache for GET requests (unless disabled)
    if (config.method === 'get' && !config.skipCache) {
      const cacheKey = getCacheKey(config.url);
      const cached = getFromCache(cacheKey);
      if (cached) {
        config.adapter = () => Promise.resolve({
          data: cached,
          status: 200,
          statusText: 'OK (cached)',
          headers: {},
          config,
        });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);


/* ============================================================
   TOKEN REFRESH LOGIC
============================================================ */

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => refreshSubscribers.push(cb);
const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const forceLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
};


/* ============================================================
   RESPONSE INTERCEPTOR
============================================================ */

api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && !response.config.skipCache && response.status === 200) {
      const cacheKey = getCacheKey(response.config.url);
      setCache(cacheKey, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // No config = fatal error
    if (!originalRequest) {
      console.error("❌ Axios Error Without Config:", error);
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;
    const isNotRetry = !originalRequest._retry;
    const isNotAuthRoute =
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/admin/login") &&
      !originalRequest.url.includes("/auth/refresh");

    // ===== Handle Token Expiration =====
    if (isUnauthorized && isNotRetry && isNotAuthRoute) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      // If refresh is already in progress → queue requests
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const newToken = data.access_token;

        if (!newToken) throw new Error("Invalid refresh response");

        // Save & apply new token
        localStorage.setItem("access_token", newToken);
        api.defaults.headers.Authorization = `Bearer ${newToken}`;

        // Process queued requests
        onRefreshed(newToken);
        isRefreshing = false;

        // Retry original
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error("❌ Refresh Failed:", err);
        isRefreshing = false;
        forceLogout();
        return Promise.reject(err);
      }
    }

    // ===== Standard error logging =====
    if (error.response) {
      console.error("❌ API Error:", {
        status: error.response.status,
        message: error.response.data?.detail || error.message,
        url: originalRequest?.url,
      });
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        console.error("❌ API Timeout:", originalRequest?.url, "- Server took too long to respond");
        error.message = "Request timeout - Server is taking too long to respond. Please try again.";
      } else {
        console.error("❌ No API Response:", originalRequest?.url, "- Server may be down");
        error.message = "Cannot connect to server. Please check if the backend is running.";
      }
    } else {
      console.error("❌ Axios Setup Error:", error.message);
    }

    return Promise.reject(error);
  }
);


/* ============================================================
   AUTH API
============================================================ */

export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  adminLogin: (data) => api.post("/api/auth/admin/login", data),
  refresh: (refreshToken) =>
    api.post("/api/auth/refresh", { refresh_token: refreshToken }),
  getProfile: () => api.get("/api/auth/profile", { skipCache: true }),
  logout: () => api.post("/api/auth/logout"),
};


/* ============================================================
   ADMIN API
============================================================ */

export const adminApi = {
  // Dashboard
  getDashboardLive: () => api.get("/api/admin/dashboard/live"),
  getDashboardComplete: () => api.get("/api/admin/dashboard/complete", { skipCache: true }),
  getDashboard: () => api.get("/api/admin/dashboard"),

  // Users
  getUsers: () => api.get("/api/admin/users"),
  createUser: (data) => api.post("/api/admin/users", data),
  getUser: (id) => api.get(`/api/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  resetPassword: (userId, newPassword) => 
    api.post(`/api/admin/reset-password/${userId}`, { new_password: newPassword }),

  // Trainers
  getTrainers: () => api.get("/api/admin/trainers"),
  createTrainer: (data) => api.post("/api/admin/create-trainer", data),
  updateTrainer: (id, data) => api.put(`/api/admin/trainers/${id}`, data),
  deleteTrainer: (id) => api.delete(`/api/admin/trainers/${id}`),

  // Trainees / Members
  getMembers: () => api.get("/api/admin/members"),
  createMember: (data) => api.post("/api/admin/members", data),
  updateMember: (id, data) => api.put(`/api/admin/members/${id}`, data),
  deleteMember: (id) => api.delete(`/api/admin/members/${id}`),
  getTraineeDetails: (id) => api.get(`/api/admin/members/${id}`),
  updateTraineeTrainer: (id, data) => api.put(`/api/admin/members/${id}/trainer`, data),
  updateTraineeMembership: (id, data) => api.put(`/api/admin/members/${id}/membership`, data),

  // Membership Plans
  getMembershipPlans: () => api.get("/api/admin/membership-plans"),
  createMembershipPlan: (data) =>
    api.post("/api/admin/membership-plans", data),
  updateMembershipPlan: (id, data) =>
    api.put(`/api/admin/membership-plans/${id}`, data),
  deleteMembershipPlan: (id) =>
    api.delete(`/api/admin/membership-plans/${id}`),

  // Equipment
  getEquipment: () => api.get("/api/admin/equipment"),
  addEquipment: (data) => api.post("/api/admin/equipment", data),
  updateEquipment: (id, data) => api.put(`/api/admin/equipment/${id}`, data),
  deleteEquipment: (id) => api.delete(`/api/admin/equipment/${id}`),
  updateEquipmentStatus: (id, status) =>
    api.put(`/api/admin/equipment/${id}?status=${status}`),

  // Gym Schedule Slots
  getGymSchedule: () => api.get("/api/admin/gym-schedule"),
  createGymScheduleSlot: (data, notify = false) => 
    api.post(`/api/admin/gym-schedule?notify=${notify}`, data),
  updateGymScheduleSlot: (id, data, notify = false) => 
    api.put(`/api/admin/gym-schedule/${id}?notify=${notify}`, data),
  deleteGymScheduleSlot: (id, notify = false) => 
    api.delete(`/api/admin/gym-schedule/${id}?notify=${notify}`),

  // Finance Summary
  getFinanceSummary: () => api.get("/api/admin/finance/summary"),

  // Profile
  getProfile: () => api.get("/api/admin/profile", { skipCache: true }),
  updateProfile: (data) => api.put("/api/admin/profile", data),
  
  // Settings
  getSettings: () => api.get("/api/admin/settings", { skipCache: true }),
  updateSettings: (data) => api.put("/api/admin/settings", data),
  
  // Messaging
  getMessages: () => api.get("/api/admin/messages/inbox"),
  getOutbox: () => api.get("/api/admin/messages/outbox"),
  sendMessage: (data) => api.post("/api/admin/messages/send", data),
  getTopPlans: () => api.get("/api/admin/dashboard/top-plans"),
  getAISuggestions: () => api.get("/api/admin/dashboard/ai-suggestions"),
  getNotifications: () => api.get("/api/admin/notifications"),
  getSystemHealth: () => api.get("/api/admin/health"),
  getProgressAnalytics: () => api.get("/api/admin/dashboard/progress"),

  /* =====================
        NEW BILLING API
  ===================== */

  // Payments list with filters
  getPayments(params) {
    return api.get('/api/admin/billing/payments', { params })
  },

  refundPayment(payload) {
    return api.post('/api/admin/billing/refund', payload)
  },

  createManualPayment(data) {
    return api.post('/api/admin/billing/manual-payment', data)
  },

  exportFinance({ format }) {
    return api.get('/api/admin/finance/export', {
      params: { format },
      responseType: 'blob',
    })
  },

  downloadReceipt(paymentId) {
    return api.get(`/api/admin/billing/receipt/${paymentId}`, {
      responseType: 'blob',
    })
  },
}



/* ============================================================
   TRAINER API
============================================================ */

export const trainerApi = {
  getTrainers: () => api.get("/api/admin/trainers"),
  getTrainerDetails: (id) => api.get(`/api/admin/trainers/${id}`),
  createTrainer: (data) => api.post("/api/admin/create-trainer", data),
  updateTrainer: (id, data) => api.put(`/api/admin/trainers/${id}`, data),
  deleteTrainer: (id) => api.delete(`/api/admin/trainers/${id}`),
  assignTrainee: (data) => api.post("/api/admin/trainers/assign-trainee", data),
  reassignTrainees: (fromId, toId) =>
    api.post(`/api/admin/trainers/reassign-trainees?from_trainer_id=${fromId}&to_trainer_id=${toId}`),

  // Salary
  updateSalary: (id, data) => api.put(`/api/admin/trainers/${id}/salary`, data),
  getEarnings: (id) => api.get(`/api/admin/trainers/${id}/earnings`),

  // Attendance
  markAttendance: (data) => api.post("/api/admin/trainers/attendance/mark", data),
  getAttendance: (id) => api.get(`/api/admin/trainers/${id}/attendance`),

  // PT Packages
  createPackage: (data) => api.post("/api/admin/trainers/pt-packages/create", data),
  getPackages: () => api.get("/api/admin/trainers/pt-packages"),

  // Schedule
  addSchedule: (data) => api.post("/api/admin/trainers/schedule/add", data),
  getSchedule: (id) => api.get(`/api/admin/trainers/${id}/schedule`),

  // Trainer Dashboard Analytics
  getTraineeProgressSummary: (traineeId) => api.get(`/api/trainer/trainee/${traineeId}/progress-summary`),
  getTraineeMilestones: (traineeId) => api.get(`/api/trainer/trainee/${traineeId}/milestones`),
  getComplianceOverview: () => api.get("/api/trainer/compliance-overview"),
};

/* ============================================================
   TRAINER DASHBOARD API (specific to trainer panel)
============================================================ */

export const trainerDashboardApi = {
  // Dashboard Overview
  getDashboard: () => api.get("/api/trainer/dashboard"),
  getTrainees: () => api.get("/api/trainer/trainees"),
  getActivity: () => api.get("/api/trainer/activity"),

  // Trainer Profile
  getProfile: () => api.get("/api/trainer/profile"),
  updateProfile: (data) => api.put("/api/trainer/profile", data),

  // Attendance (Trainer view)
  getAttendanceSummary: () => api.get("/api/trainer/attendance/summary"),
  getTraineeAttendance: (traineeId) => api.get(`/api/trainer/trainees/${traineeId}/attendance`),
  markTraineeAttendance: (traineeId, data) => api.post(`/api/trainer/trainees/${traineeId}/attendance/mark`, data),

  // Workouts & Training Plans
  getAssignedWorkouts: (traineeId) => api.get(`/api/trainer/trainees/${traineeId}/workouts`),
  createWorkoutPlan: (data) => api.post("/api/trainer/workouts/create", data),
  assignWorkout: (traineeId, workoutId) => api.post(`/api/trainer/trainees/${traineeId}/workouts/assign`, { workout_id: workoutId }),
  updateWorkout: (workoutId, data) => api.put(`/api/trainer/workouts/${workoutId}`, data),
  deleteWorkout: (workoutId) => api.delete(`/api/trainer/workouts/${workoutId}`),

  // Analytics & Progress
  getTraineeAnalytics: (traineeId) => api.get(`/api/trainer/trainees/${traineeId}/analytics`),
  getProgressSummary: (traineeId) => api.get(`/api/trainer/trainee/${traineeId}/progress-summary`),
  getMilestones: (traineeId) => api.get(`/api/trainer/trainee/${traineeId}/milestones`),
  getMeasurements: (traineeId) => api.get(`/api/trainer/trainees/${traineeId}/measurements`),
  addMeasurement: (traineeId, data) => api.post(`/api/trainer/trainees/${traineeId}/measurements`, data),

  // Earnings & Revenue
  getEarningsSummary: () => api.get("/api/trainer/earnings/summary"),
  getEarningsHistory: () => api.get("/api/trainer/earnings/history"),
  getPTPackages: () => api.get("/api/trainer/pt-packages"),
  createPTPackage: (data) => api.post("/api/trainer/pt-packages/create", data),

  // Notifications
  getNotifications: () => api.get("/api/trainer/notifications"),
  markNotificationRead: (notificationId) => api.post(`/api/trainer/notifications/${notificationId}/read`),
  deleteNotification: (notificationId) => api.delete(`/api/trainer/notifications/${notificationId}`),

  // Schedule Management
  getSchedule: () => api.get("/api/trainer/schedule"),
  addSchedule: (data) => api.post("/api/trainer/schedule", data),
  updateSchedule: (scheduleId, data) => api.put(`/api/trainer/schedule/${scheduleId}`, data),
  deleteSchedule: (scheduleId) => api.delete(`/api/trainer/schedule/${scheduleId}`),
  
  // Trainee Schedule Assignment
  assignTraineeToSchedule: (data) => api.post("/api/trainer/schedule/assign-trainee", data),
  getAssignedTraineeSchedules: () => api.get("/api/trainer/schedule/assigned-trainees"),
  unassignTraineeFromSchedule: (scheduleId, sendNotification = true) => 
    api.delete(`/api/trainer/schedule/unassign-trainee/${scheduleId}?send_notification=${sendNotification}`),

  // Reports & Export
  generateProgressReport: (traineeId) => api.get(`/api/trainer/trainees/${traineeId}/report`),
  exportProgressPDF: (traineeId) => api.get(`/api/trainer/trainees/${traineeId}/report/pdf`, { responseType: 'blob' }),

  // Feedback System
  sendFeedback: (traineeId, data) => api.post(`/api/trainer/trainees/${traineeId}/feedback`, data),
  getFeedback: (traineeId) => api.get(`/api/trainer/trainees/${traineeId}/feedback`),

  // AI Reports
  getAIReport: (traineeId) => api.get(`/api/trainer/trainees/${traineeId}/ai-reports`),
};



/* ============================================================
   TRAINEE API
============================================================ */

export const traineeApi = {
  getDashboard: () => api.get("/api/trainee/dashboard"),
  getWorkouts: () => api.get("/api/trainee/workouts"),
  getNutrition: () => api.get("/api/trainee/nutrition"),
  getProfile: () => api.get("/api/trainee/profile"),
  updateProfile: (data) => api.put("/api/trainee/profile", data),
  createPayment(data) {
    return api.post("/api/trainee/payments/create", data);
  },
  // Progress tracking
  getProgress: () => api.get("/api/trainee/progress"),
  addMeasurement: (data) => api.post("/api/trainee/measurements", data),
  getProgressAnalytics: (days = 30) => api.get(`/api/trainee/progress/analytics?days=${days}`),
  getProgressReport: () => api.get("/api/trainee/progress/report"),
  
  // Attendance
  checkIn: () => api.post("/api/trainee/attendance/check-in"),
  checkOut: () => api.post("/api/trainee/attendance/check-out"),
  getTodayAttendance: () => api.get("/api/trainee/attendance/today"),
  getAttendanceHistory: (days = 30) => api.get(`/api/trainee/attendance/history?days=${days}`),
};


/* ============================================================
   PAYMENTS API (for trainees)
============================================================ */

export const paymentsApi = {
  // Get all membership plans
  getPlans: () => api.get("/api/payments/plans"),
  
  // Create Razorpay order
  createOrder: (data) => api.post("/api/payments/create-order", data),
  
  // Verify payment after Razorpay callback
  verifyPayment: (data) => api.post("/api/payments/verify-payment", data),
  
  // Get my payment history
  getMyPayments: () => api.get("/api/payments/my-payments"),
  
  // Get my current membership
  getMyMembership: () => api.get("/api/payments/my-membership"),
};


/* ============================================================
   CHAT API (AI Chat)
============================================================ */

export const chatApi = {
  // Send message to AI and get response
  query: (data) => api.post("/api/chat/query", data),
  // Check AI status
  getStatus: () => api.get("/api/chat/"),
  // Legacy methods for compatibility
  sendMessage: (data) => api.post("/api/chat/send", data),
  getHistory: () => api.get("/api/chat/history"),
};


/* ============================================================
   NUTRITION API (Enhanced AI-Powered Meal Tracking)
============================================================ */

export const nutritionApi = {
  // ────── IMAGE ANALYSIS ──────
  // Analyze meal image with AI
  analyzeMeal: (formData) => {
    return api.post("/api/nutrition/analyze-meal", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  
  // ────── MANUAL LOGGING ──────
  // Log a food manually with full nutrition
  logFood: (data) => api.post("/api/nutrition/log-food", data),
  
  // ────── DAILY TRACKING ──────
  // Get daily nutrition summary with recommendations
  getDailySummary: (date) => api.get(`/api/nutrition/daily-summary${date ? `?target_date=${date}` : ""}`),
  
  // ────── WEEKLY ANALYTICS ──────
  // Get weekly nutrition summary for charts
  getWeeklySummary: (days = 7) => api.get(`/api/nutrition/weekly-summary?days=${days}`),
  
  // ────── FOOD DATABASE ──────
  // Search food in database
  searchFood: (foodName, portion = 100) => api.get(`/api/nutrition/search-food/${encodeURIComponent(foodName)}?portion_grams=${portion}`),
  
  // ────── GOALS & PERSONALIZATION ──────
  // Get personalized nutrition goals
  getGoals: () => api.get("/api/nutrition/goals"),
  
  // Update nutrition goals based on user profile
  updateGoals: (data) => api.post("/api/nutrition/goals", data),
  
  // ────── MEAL PLANNING ──────
  // Get meal suggestions for specific macros
  getSuggestedMeals: (protein, carbs, fats) => 
    api.get(`/api/nutrition/suggest-meals?target_protein=${protein}&target_carbs=${carbs}&target_fats=${fats}`),
  
  // Get personalized 7-day meal prep plan
  getMealPlan: (days = 7) => api.get(`/api/nutrition/meal-prep-plan?days=${days}`),
  
  // ────── LOG MANAGEMENT ──────
  // Get all nutrition logs with pagination
  getLogs: (limit = 50, offset = 0) => api.get(`/api/nutrition/logs?limit=${limit}&offset=${offset}`),
  
  // Delete a nutrition log
  deleteLog: (logId) => api.delete(`/api/nutrition/logs/${logId}`),
};

/* ============================================================
   MESSAGING API (User-to-User Messaging)
============================================================ */

export const messagingApi = {
  // Get all conversations
  getConversations: () => api.get("/api/chat/messages/conversations"),
  
  // Get messages with a specific user
  getMessages: (userId) => api.get(`/api/chat/messages/${userId}`),
  
  // Send a message to a user
  sendMessage: (data) => api.post("/api/chat/messages/send", data),
  
  // Get available contacts to message
  getContacts: () => api.get("/api/chat/messages/contacts/available"),
  
  // Get unread message count
  getUnreadCount: () => api.get("/api/chat/messages/unread/count"),
};


/* ============================================================
   HEALTH CHECK
============================================================ */

export const healthCheck = async () => {
  const { data } = await axios.get(`${API_URL}/health`, { timeout: 5000 });
  return data;
};

export default api;

