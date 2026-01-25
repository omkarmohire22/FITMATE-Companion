import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { traineeApi, paymentsApi, messagingApi, nutritionApi } from '../../utils/api'
import {
  Activity, Target, TrendingUp, Award, Dumbbell, Utensils, BarChart, MessageCircle,
  Users, Settings, Bell, RefreshCw, Eye, MoreVertical, CheckCircle, XCircle,
  Clock, ChevronRight, Sparkles, Zap, Medal, Star, LogOut, Calendar, Flame,
  Heart, Trophy, Crown, Gem, Play, Pause, RotateCcw, Menu, X, Droplet,
  TrendingDown, ArrowUp, ArrowDown, Plus, Image, Camera, Upload, Send,
  ShoppingCart, Coffee, Apple, Pizza, Salad, Moon, Sun, Music, Volume2,
  MapPin, Timer, List, Grid, BarChart3, PieChart, Download, Share2, Filter,
  Maximize2, Minimize2, Info, AlertCircle, CreditCard, User, Mail, Phone,
  MapPinned, Edit, Save, DollarSign, Check, Home, Battery, ChevronLeft,
  UserCheck, LogIn, LogOut as LogOutIcon, History, CalendarCheck, Fingerprint, Shield, Scale, Ruler
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import ProgressTracker from '../../components/progress/ProgressTracker'
import TraineeProfile from '../../components/trainee/TraineeProfile'
import AIChatbot from '../../components/chat/AIChatbot'
import NutritionTracker from '../../components/nutrition/NutritionTracker'
import { MetricCard, DashboardCard, SectionHeader, LoadingSpinner, EmptyState, AlertBox } from '../../components/ui/DashboardComponents'
import FeedbackButton from '../../components/ui/FeedbackButton'

const TraineeDashboard = () => {
  const { logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false) // Closed by default on mobile
  const [workoutActive, setWorkoutActive] = useState(false)
  const [workoutCount, setWorkoutCount] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState('push-ups')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const videoRef = useRef(null)

  // User Data (from backend)
  const [userData, setUserData] = useState(null)

  // Stats Data (from backend)
  const [stats, setStats] = useState(null)

  // Attendance State
  const [attendanceStatus, setAttendanceStatus] = useState(null) // 'not_checked_in', 'checked_in', 'checked_out'
  const [attendanceData, setAttendanceData] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  // Training Schedule State (sessions with trainer)
  const [mySchedule, setMySchedule] = useState({ schedule: [], trainer: null, today_sessions: [], upcoming_session: null })
  const [scheduleLoading, setScheduleLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setLoadError(null)
      try {
        // Fetch dashboard and profile in parallel for faster loading
        const [statsRes, profileRes] = await Promise.all([
          traineeApi.getDashboard(),
          traineeApi.getProfile()
        ])

        // Accept both .data and direct object
        const s = statsRes.data || statsRes
        // Normalize and robustly map all expected fields
        setStats({
          weeklyWorkouts: s.weeklyWorkouts ?? s.weekly_workouts ?? 0,
          totalWorkouts: s.totalWorkouts ?? s.total_workouts ?? 0,
          calories: s.calories ?? 0,
          caloriesBudget: s.caloriesBudget ?? s.calories_budget ?? 2200,
          caloriesBurned: s.caloriesBurned ?? s.calories_burned ?? 0,
          waterIntake: s.waterIntake ?? s.water_intake ?? 0,
          waterGoal: s.waterGoal ?? s.water_goal ?? 8,
          streak: s.streak ?? s.day_streak ?? 0,
          achievements: s.achievements ?? 0,
          avgFormScore: s.avgFormScore ?? s.avg_form_score ?? 0,
          bestStreak: s.bestStreak ?? s.best_streak ?? 0,
          currentWeight: s.currentWeight ?? s.current_weight ?? '--'
        })

        // Normalize profile fields for UI
        const p = profileRes.data || profileRes
        setUserData({
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          location: p.address || p.location || '',
          memberSince: p.created_at?.split('T')[0] || '',
          plan: p.plan || p.membership_plan || '',
          height: p.height !== undefined && p.height !== null ? p.height + ' cm' : '',
          weight: p.weight !== undefined && p.weight !== null ? p.weight + ' kg' : '',
          age: p.age || '',
          goal: p.goal || '',
          targetWeight: p.target_weight !== undefined && p.target_weight !== null ? p.target_weight + ' kg' : '',
          fitnessLevel: p.fitness_level || '',
          trainerId: p.trainer_id || '',
          // New enhanced fields
          fitnessGoals: p.fitness_goals || '',
          dateOfBirth: p.date_of_birth || '',
          gender: p.gender || '',
          address: p.address || '',
          emergencyContactName: p.emergency_contact_name || '',
          emergencyContactPhone: p.emergency_contact_phone || '',
          healthConditions: p.health_conditions || '',
        })
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Dashboard load error:', err)
        setLoadError(err.message || 'Failed to load dashboard')
        // On error, clear data (do not show dummy values)
        setStats(null)
        setUserData(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      const [statsRes, profileRes] = await Promise.all([
        traineeApi.getDashboard(),
        traineeApi.getProfile()
      ])

      const s = statsRes.data || statsRes
      setStats({
        weeklyWorkouts: s.weeklyWorkouts ?? s.weekly_workouts ?? 0,
        totalWorkouts: s.totalWorkouts ?? s.total_workouts ?? 0,
        calories: s.calories ?? 0,
        caloriesBudget: s.caloriesBudget ?? s.calories_budget ?? 2200,
        caloriesBurned: s.caloriesBurned ?? s.calories_burned ?? 0,
        waterIntake: s.waterIntake ?? s.water_intake ?? 0,
        waterGoal: s.waterGoal ?? s.water_goal ?? 8,
        streak: s.streak ?? s.day_streak ?? 0,
        achievements: s.achievements ?? 0,
        avgFormScore: s.avgFormScore ?? s.avg_form_score ?? 0,
        bestStreak: s.bestStreak ?? s.best_streak ?? 0,
        currentWeight: s.currentWeight ?? s.current_weight ?? '--'
      })

      const p = profileRes.data || profileRes
      setUserData({
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        location: p.address || p.location || '',
        memberSince: p.created_at?.split('T')[0] || '',
        plan: p.plan || p.membership_plan || '',
        height: p.height !== undefined && p.height !== null ? p.height + ' cm' : '',
        weight: p.weight !== undefined && p.weight !== null ? p.weight + ' kg' : '',
        age: p.age || '',
        goal: p.goal || '',
        targetWeight: p.target_weight !== undefined && p.target_weight !== null ? p.target_weight + ' kg' : '',
        fitnessLevel: p.fitness_level || '',
        trainerId: p.trainer_id || '',
        fitnessGoals: p.fitness_goals || '',
        dateOfBirth: p.date_of_birth || '',
        gender: p.gender || '',
        address: p.address || '',
        emergencyContactName: p.emergency_contact_name || '',
        emergencyContactPhone: p.emergency_contact_phone || '',
        healthConditions: p.health_conditions || '',
      })

      setLastUpdated(new Date())
      toast.success('Dashboard refreshed!', { duration: 2000 })
    } catch (err) {
      console.error('Refresh error:', err)
      toast.error('Failed to refresh dashboard')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Workout History (from backend)
  const [workoutHistory, setWorkoutHistory] = useState([])

  // Fetch workout history from backend
  useEffect(() => {
    async function fetchWorkouts() {
      try {
        const res = await traineeApi.getWorkouts()
        // Normalize backend data to fit UI
        const workouts = (res.data?.workouts || res.data || []).map(w => ({
          id: w.id,
          date: w.created_at ? w.created_at.split('T')[0] : w.date || '',
          type: w.exercise_type || w.type || '',
          reps: w.total_reps || w.reps || null,
          formScore: w.avg_accuracy || w.form_score || null,
          calories: w.calories_burned || w.calories || null,
          duration: w.duration_minutes ? `${w.duration_minutes} min` : w.duration || '',
        }))
        setWorkoutHistory(workouts)
      } catch (err) {
        // fallback: leave as empty or show error
      }
    }
    fetchWorkouts()
  }, [])

  // Fetch training schedule (sessions with trainer)
  useEffect(() => {
    async function fetchSchedule() {
      setScheduleLoading(true)
      try {
        const res = await traineeApi.getMySchedule()
        setMySchedule(res.data || { schedule: [], trainer: null, today_sessions: [], upcoming_session: null })
      } catch (err) {
        console.error('Failed to load schedule:', err)
      } finally {
        setScheduleLoading(false)
      }
    }
    fetchSchedule()
  }, [])

  // Meals Data - Now fetched from backend
  const [meals, setMeals] = useState([])
  const [mealStats, setMealStats] = useState(null)
  const [newMeal, setNewMeal] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '' })

  // Fetch meals from backend
  useEffect(() => {
    async function fetchMeals() {
      try {
        const response = await nutritionApi.getDailySummary()
        const logs = response.data.logs || []
        setMeals(logs)
        setMealStats(response.data.stats || null)
      } catch (err) {
        console.error('Failed to load meals:', err)
      }
    }
    fetchMeals()
    // Refresh meals every 30 seconds to catch updates from Nutrition Tracker
    const interval = setInterval(fetchMeals, 30000)
    return () => clearInterval(interval)
  }, [])

  // Payment Plans - now from API
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [plans, setPlans] = useState([])
  const [currentMembership, setCurrentMembership] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Fetch plans from backend
  useEffect(() => {
    async function fetchPlans() {
      try {
        const [plansRes, membershipRes] = await Promise.all([
          paymentsApi.getPlans(),
          paymentsApi.getMyMembership()
        ]);
        setPlans(plansRes.data?.plans || []);
        setCurrentMembership(membershipRes.data?.membership || null);
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    }
    fetchPlans();
  }, []);

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle plan purchase
  const handlePurchasePlan = async (plan) => {
    try {
      setPaymentLoading(true);
      setSelectedPlan(plan.id);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load payment gateway');
        return;
      }

      const orderRes = await paymentsApi.createOrder({
        amount: plan.price,
        plan_id: plan.id
      });

      const { order_id, amount, currency, key_id } = orderRes.data;

      if (!key_id) {
        alert('Payment gateway not configured. Please contact admin.');
        return;
      }

      const options = {
        key: key_id,
        amount: amount * 100,
        currency: currency,
        name: 'FitMate Pro',
        description: `${plan.name} Membership`,
        order_id: order_id,
        handler: async function (response) {
          try {
            await paymentsApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: plan.id
            });

            alert('Payment successful! Membership activated.');

            const membershipRes = await paymentsApi.getMyMembership();
            setCurrentMembership(membershipRes.data?.membership || null);
          } catch (err) {
            alert('Payment verification failed');
          }
        },
        theme: { color: '#6366F1' },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
            setSelectedPlan(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ====================== MESSAGING STATE ======================
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Fetch conversations and contacts
  useEffect(() => {
    async function fetchMessaging() {
      try {
        const [convRes, contactsRes, unreadRes] = await Promise.all([
          messagingApi.getConversations(),
          messagingApi.getContacts(),
          messagingApi.getUnreadCount()
        ]);
        setConversations(convRes.data?.conversations || []);
        setContacts(contactsRes.data?.contacts || []);
        setUnreadCount(unreadRes.data?.unread_count || 0);
      } catch (err) {
        console.error('Failed to load messaging data:', err);
      }
    }
    fetchMessaging();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessaging, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load notifications
  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      // Fetch system notifications from API
      const notifRes = await traineeApi.getNotifications(false).catch(() => ({ data: { notifications: [] } }));
      const systemNotifs = (notifRes.data?.notifications || []).map(n => ({
        id: n.id,
        notifId: n.id, // Keep original ID for API calls
        type: n.notification_type || 'system',
        title: n.title,
        message: n.message,
        timestamp: n.created_at,
        is_read: n.is_read,
        icon: n.notification_type === 'schedule' ? Calendar : Bell
      }));

      // Combine notifications from various sources
      const notificationList = [
        // System notifications (schedule updates, announcements, etc.)
        ...systemNotifs,
        // Messages from trainers/admin
        ...(conversations || []).filter(conv => conv.unread_count > 0).map(conv => ({
          id: `msg-${conv.user_id}`,
          type: 'message',
          title: `Message from ${conv.user_name || 'Trainer'}`,
          message: conv.last_message || 'New message',
          timestamp: conv.last_message_time,
          is_read: false, // Has unread messages
          userId: conv.user_id,
          icon: MessageCircle
        })),
        // Additional notifications can be added here
      ];
      // Sort by timestamp, newest first
      notificationList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotifications(notificationList);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark notification as read
  const handleNotificationClick = async (notif) => {
    try {
      // If it's a system notification (has notifId), mark it as read via API
      if (notif.notifId && !notif.is_read) {
        await traineeApi.markNotificationRead(notif.notifId);
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
        );
      }

      // Handle navigation based on notification type
      if (notif.type === 'message' && notif.userId) {
        // Mark messages as read and navigate to messages
        await messagingApi.markMessagesRead(notif.userId).catch(() => { });
        setActiveTab('messages');
        setShowNotifications(false);
      } else if (notif.type === 'schedule') {
        setActiveTab('dashboard');
        setShowNotifications(false);
      } else if (notif.type === 'payment') {
        setActiveTab('payment');
        setShowNotifications(false);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await traineeApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Load notifications when dropdown opens
  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications, conversations]);

  // Load messages when conversation selected
  const loadMessages = async (userId) => {
    try {
      setMessagesLoading(true);
      const res = await messagingApi.getMessages(userId);
      setConversationMessages(res.data?.messages || []);
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await messagingApi.sendMessage({
        receiver_id: selectedConversation.id,
        message: newMessage.trim()
      });
      setNewMessage('');
      // Reload messages
      loadMessages(selectedConversation.id);
      // Refresh conversations
      const convRes = await messagingApi.getConversations();
      setConversations(convRes.data?.conversations || []);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message');
    }
  };

  // Select a conversation
  const selectConversation = (contact) => {
    setSelectedConversation(contact);
    loadMessages(contact.id || contact.user_id);
  };

  // ====================== ATTENDANCE FUNCTIONS ======================
  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        traineeApi.getTodayAttendance(),
        traineeApi.getAttendanceHistory(30)
      ]);

      setAttendanceStatus(todayRes.data?.status || 'not_checked_in');
      setAttendanceData(todayRes.data?.attendance || null);
      setAttendanceHistory(historyRes.data?.records || []);
      setAttendanceStats(historyRes.data?.stats || null);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
    }
  };

  // Fetch attendance on mount
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Handle Check In
  const handleCheckIn = async () => {
    try {
      setAttendanceLoading(true);
      const res = await traineeApi.checkIn();
      if (res.data?.status === 'already_checked_in') {
        toast.success('You are already checked in today!');
      } else {
        toast.success('✅ Checked in successfully!');
      }
      await fetchAttendanceData();
    } catch (err) {
      console.error('Check-in error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to check in';
      toast.error(errorMsg);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Handle Check Out
  const handleCheckOut = async () => {
    try {
      setAttendanceLoading(true);
      const res = await traineeApi.checkOut();
      toast.success(`✅ Checked out! Duration: ${res.data?.duration_minutes || 0} minutes`);
      await fetchAttendanceData();
    } catch (err) {
      console.error('Check-out error:', err);
      toast.error(err.response?.data?.detail || 'Failed to check out');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Exercises
  const exercises = [
    { id: 'push-ups', name: 'Push-ups', icon: '💪', target: 'Chest & Triceps', color: 'from-red-500 to-orange-500' },
    { id: 'squats', name: 'Squats', icon: '🦵', target: 'Legs & Glutes', color: 'from-blue-500 to-cyan-500' },
    { id: 'plank', name: 'Plank', icon: '🧘', target: 'Core', color: 'from-green-500 to-emerald-500' },
    { id: 'pull-ups', name: 'Pull-ups', icon: '🏋️', target: 'Back & Biceps', color: 'from-purple-500 to-pink-500' },
    { id: 'sit-ups', name: 'Sit-ups', icon: '🤸', target: 'Abs', color: 'from-yellow-500 to-amber-500' },
    { id: 'lunges', name: 'Lunges', icon: '🚶', target: 'Legs', color: 'from-indigo-500 to-blue-500' }
  ]

  // Start Workout
  const startWorkout = async () => {
    setWorkoutActive(true)
    setWorkoutCount(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      alert('Camera access denied. Please enable camera permissions.')
      setWorkoutActive(false)
    }
  }

  // Stop Workout
  const stopWorkout = async () => {
    setWorkoutActive(false)
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
    }

    // Save workout to backend
    try {
      const payload = {
        exercise_type: exercises.find(e => e.id === selectedExercise)?.name || selectedExercise,
        duration_minutes: Math.ceil(workoutCount / 1.5) || 10, // fallback duration
        total_reps: workoutCount,
        calories_burned: Math.floor(workoutCount * 2.5),
        notes: null
      }
      await traineeApi.logManualWorkout ? traineeApi.logManualWorkout(payload) : null
    } catch (err) {
      // Optionally show error
    }
    // Refresh workout history from backend
    try {
      const res = await traineeApi.getWorkouts()
      const workouts = (res.data?.workouts || res.data || []).map(w => ({
        id: w.id,
        date: w.created_at ? w.created_at.split('T')[0] : w.date || '',
        type: w.exercise_type || w.type || '',
        reps: w.total_reps || w.reps || null,
        formScore: w.avg_accuracy || w.form_score || null,
        calories: w.calories_burned || w.calories || null,
        duration: w.duration_minutes ? `${w.duration_minutes} min` : w.duration || '',
      }))
      setWorkoutHistory(workouts)
    } catch { }
  }

  // Log Water
  const logWater = () => {
    setStats(prev => ({
      ...prev,
      waterIntake: Math.min(prev.waterIntake + 1, prev.waterGoal)
    }))
  }

  // Add Meal
  const addMeal = () => {
    if (!newMeal.name || !newMeal.calories) return

    const meal = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      ...newMeal,
      calories: parseInt(newMeal.calories),
      protein: parseInt(newMeal.protein) || 0,
      carbs: parseInt(newMeal.carbs) || 0,
      fats: parseInt(newMeal.fats) || 0
    }

    setMeals([...meals, meal])
    setStats(prev => ({
      ...prev,
      calories: prev.calories + meal.calories
    }))
    setNewMeal({ name: '', calories: '', protein: '', carbs: '', fats: '' })
  }

  // Navigation Tabs
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-600 bg-blue-50' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils, color: 'text-green-600 bg-green-50' },
    { id: 'progress', label: 'Progress', icon: BarChart, color: 'text-sky-600 bg-sky-50' },
    { id: 'coach', label: 'AI Coach', icon: MessageCircle, color: 'text-pink-600 bg-pink-50' },
    { id: 'messages', label: 'Messages', icon: Mail, color: 'text-teal-600 bg-teal-50' },
    { id: 'payment', label: 'Plans', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'profile', label: 'Profile', icon: User, color: 'text-slate-600 bg-gray-50' }
  ]

  // Loading state - show spinner while data loads
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center border border-gray-200"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-gray-200 border-t-primary-600 rounded-full mb-6"
          />
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-slate-900">Loading Dashboard</h2>
          <p className="text-slate-600 text-center text-sm">Getting your fitness data ready...</p>
        </motion.div>
      </div>
    )
  }

  // Error state - show error only after loading completes with failure
  if (!stats || !userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col items-center border border-gray-200"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-slate-900">Dashboard Unavailable</h2>
          <p className="text-slate-600 mb-6 text-center text-sm">
            {loadError || "We couldn't load your dashboard data. Please check your login or try again later."}
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
            >
              Retry
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="px-6 py-3 bg-gray-100 text-slate-700 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm border border-gray-200"
            >
              Logout
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-md h-16 transition-colors duration-300 ${isDark ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-slate-200'
        }`}>
        <div className="px-3 sm:px-6 h-full flex items-center">
          <div className="flex justify-between items-center gap-2 sm:gap-4 w-full">
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-700/50 rounded-lg lg:hidden transition-colors duration-200"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5 text-indigo-400" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <span className="text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent tracking-wide">
                    FitMate
                  </span>
                  <p className="text-[10px] sm:text-xs text-indigo-400 font-semibold tracking-wider hidden xs:block">
                    Trainee Portal
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors relative group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh Dashboard"
              >
                <RefreshCw className={`w-5 h-5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg z-50 border border-slate-700">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </button>

              {/* Notifications Bell */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-slate-700/50 rounded-lg transition-colors group"
              >
                <Bell className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 animate-pulse">
                    {notifications.filter(n => !n.is_read).length > 9 ? '9+' : notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>

              {/* User Profile */}
              {userData && (
                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-700/50">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs sm:text-sm font-bold text-white">
                      {userData.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] sm:text-xs text-indigo-400 font-semibold">
                      {userData.plan || 'Member'}
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-lg">
                    {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 border border-red-500/20 hover:border-red-500/40 text-xs sm:text-sm font-bold"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Notifications Dropdown */}
        <AnimatePresence>
          {showNotifications && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-40"
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="absolute right-4 sm:right-6 top-full mt-2 w-80 sm:w-96 bg-slate-900 rounded-2xl shadow-2xl z-50 border border-slate-700 max-h-[520px] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Notifications</h3>
                        <p className="text-xs text-slate-400">
                          {notifications.length > 0 ? `${notifications.length} notification${notifications.length > 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Notification Categories */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/30 flex items-center gap-2 overflow-x-auto">
                    {[{ id: 'all', label: 'All', count: notifications.length }, { id: 'message', label: 'Messages', icon: MessageCircle }, { id: 'workout', label: 'Workouts', icon: Dumbbell }].map(cat => (
                      <button
                        key={cat.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${cat.id === 'all'
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                          }`}
                      >
                        {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
                        {cat.label}
                        {cat.count && <span className="ml-1 px-1.5 py-0.5 bg-indigo-500/30 rounded-full text-[10px]">{cat.count}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Notifications List */}
                <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {notificationsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 border-3 border-slate-700 border-t-indigo-500 rounded-full mb-3"
                      />
                      <p className="text-slate-400 text-sm">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-16 px-6 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                        <Bell className="w-10 h-10 text-slate-600" />
                      </div>
                      <h4 className="text-white font-semibold mb-2">No notifications</h4>
                      <p className="text-slate-400 text-sm">You're all caught up! Check back later.</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {notifications.map((notif, idx) => {
                        const notifConfig = {
                          message: { icon: MessageCircle, bg: 'from-blue-500 to-cyan-500', lightBg: 'bg-blue-500/10', color: 'text-blue-400' },
                          workout: { icon: Dumbbell, bg: 'from-purple-500 to-pink-500', lightBg: 'bg-purple-500/10', color: 'text-purple-400' },
                          attendance: { icon: CalendarCheck, bg: 'from-green-500 to-emerald-500', lightBg: 'bg-green-500/10', color: 'text-green-400' },
                          payment: { icon: CreditCard, bg: 'from-amber-500 to-orange-500', lightBg: 'bg-amber-500/10', color: 'text-amber-400' },
                          reminder: { icon: Clock, bg: 'from-rose-500 to-red-500', lightBg: 'bg-rose-500/10', color: 'text-rose-400' },
                          schedule: { icon: Calendar, bg: 'from-teal-500 to-emerald-500', lightBg: 'bg-teal-500/10', color: 'text-teal-400' },
                          system: { icon: Bell, bg: 'from-indigo-500 to-purple-500', lightBg: 'bg-indigo-500/10', color: 'text-indigo-400' },
                          default: { icon: Info, bg: 'from-slate-500 to-slate-600', lightBg: 'bg-slate-500/10', color: 'text-slate-400' }
                        };
                        const config = notifConfig[notif.type] || notifConfig.default;
                        const NotifIcon = config.icon;
                        const isUnread = !notif.is_read;

                        return (
                          <motion.div
                            key={notif.id || idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ x: 4, backgroundColor: 'rgba(51, 65, 85, 0.3)' }}
                            onClick={() => handleNotificationClick(notif)}
                            className={`mx-2 px-4 py-3 rounded-xl cursor-pointer transition-all relative ${isUnread ? 'bg-slate-800/50' : ''}`}
                          >
                            {/* Unread Indicator */}
                            {isUnread && (
                              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            )}

                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.bg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                <NotifIcon className="w-5 h-5 text-white" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`font-semibold text-sm ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                                    {notif.title}
                                  </p>
                                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                    {notif.timestamp ? (() => {
                                      const date = new Date(notif.timestamp);
                                      const now = new Date();
                                      const diffMs = now - date;
                                      const diffMins = Math.floor(diffMs / 60000);
                                      const diffHours = Math.floor(diffMins / 60);
                                      const diffDays = Math.floor(diffHours / 24);
                                      if (diffMins < 1) return 'Just now';
                                      if (diffMins < 60) return `${diffMins}m ago`;
                                      if (diffHours < 24) return `${diffHours}h ago`;
                                      return `${diffDays}d ago`;
                                    })() : 'Just now'}
                                  </span>
                                </div>
                                <p className="text-slate-400 text-xs mt-1 line-clamp-2">{notif.message}</p>

                                {/* Action Button */}
                                {notif.type === 'message' && (
                                  <button
                                    onClick={() => { setActiveTab('messages'); setShowNotifications(false); }}
                                    className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                                  >
                                    View message <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/30 space-y-2">
                    {notifications.some(n => !n.is_read) && (
                      <button
                        onClick={handleMarkAllRead}
                        className="w-full py-2 text-center text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all flex items-center justify-center gap-2 border border-emerald-500/30"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark all as read
                      </button>
                    )}
                    <button
                      onClick={() => { setActiveTab('messages'); setShowNotifications(false); }}
                      className="w-full py-2 text-center text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/50 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      View all notifications
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Bottom Navigation - Fixed at bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 py-2 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50">
        {navTabs.slice(0, 5).map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 whitespace-nowrap text-xs ${isActive
                ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30'
                : 'text-slate-500 hover:text-indigo-400'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span className="mt-0.5 font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="flex">
        {/* Enhanced Sidebar */}
        <aside className={`
          fixed left-0 top-16 h-[calc(100vh-64px)] w-64 border-r transition-all duration-300 ease-in-out lg:translate-x-0 overflow-hidden
          z-40 ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${isDark
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200'
          }
        `}>
          <div className="h-full flex flex-col overflow-hidden">
            {/* User Profile Section */}
            <div className={`p-5 border-b transition-colors duration-300 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
              >
                <div className="relative group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {userData?.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 dark:border-slate-900 border-white shadow-sm"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold truncate transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {userData?.name || 'User'}
                  </h3>
                  <p className={`text-[10px] uppercase tracking-wider font-bold transition-colors duration-300 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {userData?.plan || 'Member'}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Scrollable Navigation */}
            <div className={`flex-1 overflow-y-auto px-3 py-5 space-y-6 scrollbar-none transition-colors duration-300 ${isDark ? 'scrollbar-thumb-slate-700' : 'scrollbar-thumb-slate-200'}`}>
              {/* Main Navigation */}
              <div>
                <h2 className={`px-4 mb-3 text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Main Menu
                </h2>
                <nav className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: Home, gradient: 'from-blue-500 to-indigo-500' },
                    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, gradient: 'from-emerald-500 to-teal-500' },
                    { id: 'nutrition', label: 'Nutrition Tracker', icon: Utensils, gradient: 'from-green-500 to-emerald-500' },
                    { id: 'progress', label: 'My Progress', icon: BarChart, gradient: 'from-sky-500 to-blue-500' },
                  ].map((tab, idx) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          if (window.innerWidth < 1024) setSidebarOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                          ${isActive
                            ? isDark
                              ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : isDark
                              ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }
                        `}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${isActive
                          ? `bg-gradient-to-br ${tab.gradient} text-white`
                          : isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700' : 'bg-slate-50 text-slate-400 group-hover:bg-white'
                          }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="flex-1 text-left text-sm font-medium">{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="w-1.5 h-6 rounded-full bg-indigo-500 absolute right-0"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Communication Section */}
              <div>
                <h2 className={`px-4 mb-3 text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Communication
                </h2>
                <nav className="space-y-1">
                  {[
                    { id: 'coach', label: 'AI Fitness Coach', icon: MessageCircle, gradient: 'from-pink-500 to-rose-500', badge: 'AI' },
                    { id: 'messages', label: 'Trainer Chat', icon: Mail, gradient: 'from-teal-500 to-cyan-500', badge: unreadCount > 0 ? unreadCount : null },
                  ].map((tab, idx) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          if (window.innerWidth < 1024) setSidebarOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                          ${isActive
                            ? isDark
                              ? 'bg-indigo-500/10 text-white border border-indigo-500/20'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : isDark
                              ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }
                        `}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${isActive
                          ? `bg-gradient-to-br ${tab.gradient} text-white`
                          : isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700' : 'bg-slate-50 text-slate-400 group-hover:bg-white'
                          }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="flex-1 text-left text-sm font-medium">{tab.label}</span>
                        {tab.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${tab.badge === 'AI'
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                            : 'bg-red-500 text-white min-w-[20px] text-center'
                            }`}>
                            {tab.badge}
                          </span>
                        )}
                        {isActive && !tab.badge && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="w-1.5 h-6 rounded-full bg-indigo-500 absolute right-0"
                          />
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Account Section */}
              <div>
                <h2 className={`px-4 mb-3 text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Account Settings
                </h2>
                <nav className="space-y-1">
                  {[
                    { id: 'payment', label: 'Membership Plans', icon: CreditCard, gradient: 'from-orange-500 to-amber-500' },
                    { id: 'profile', label: 'Account Profile', icon: User, gradient: 'from-slate-600 to-slate-700' },
                  ].map((tab, idx) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          if (window.innerWidth < 1024) setSidebarOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                          ${isActive
                            ? isDark
                              ? 'bg-indigo-500/10 text-white border border-indigo-500/20'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : isDark
                              ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }
                        `}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${isActive
                          ? `bg-gradient-to-br ${tab.gradient} text-white`
                          : isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700' : 'bg-slate-50 text-slate-400 group-hover:bg-white'
                          }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="flex-1 text-left text-sm font-medium">{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="w-1.5 h-6 rounded-full bg-indigo-500 absolute right-0"
                          />
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Today's Summary Card */}
              <div className={`mt-2 p-4 rounded-2xl border transition-all duration-300 shadow-lg ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-100 shadow-slate-100/50'
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <Activity className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                    Daily Goal
                  </h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {stats ? (
                  <div className="space-y-4">
                    {/* Calories */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          CALORIES
                        </span>
                        <span className={`font-bold text-[11px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {stats.calories} / {stats.caloriesBudget}
                        </span>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((stats.calories / stats.caloriesBudget) * 100, 100)}%` }}
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                        />
                      </div>
                    </div>

                    {/* Water */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-sky-500" />
                          HYDRATION
                        </span>
                        <span className={`font-bold text-[11px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {stats.waterIntake} / {stats.waterGoal} L
                        </span>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((stats.waterIntake / stats.waterGoal) * 100, 100)}%` }}
                          className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.4)]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-6 bg-slate-700/20 rounded-lg w-full" />
                    <div className="h-6 bg-slate-700/20 rounded-lg w-3/4" />
                  </div>
                )}
              </div>
            </div>

            {/* Theme Toggle Section */}
            <div className={`p-4 border-t transition-colors duration-300 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                onClick={toggleTheme}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${isDark
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-amber-500 border border-slate-100 shadow-sm'
                    }`}>
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-semibold">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isDark ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${isDark ? 'left-5.5' : 'left-0.5'}`}></div>
                </div>
              </button>

              <button
                onClick={logout}
                className={`mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group border ${isDark
                    ? 'bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
                    : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100 hover:border-red-200 shadow-sm'
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-red-500/10' : 'bg-white border border-red-100 shadow-sm'
                  }`}>
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 lg:ml-64 min-h-screen pt-16 pb-20 lg:pb-0 transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-slate-50'
          }`}>
          <div className="p-3 sm:p-6 max-w-7xl mx-auto">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5 sm:space-y-6">
                {/* Welcome Card with Check-in */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Trophy className="w-7 h-7 text-yellow-300" />
                          </div>
                          <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">
                              Welcome back, {userData ? userData.name.split(' ')[0] : 'Champ'}!
                            </h1>
                            <p className="text-white/80 text-sm font-medium">
                              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        {stats?.streak > 0 && (
                          <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 hover:bg-white/30 transition-all"
                          >
                            <Flame className="w-5 h-5 text-yellow-300 animate-pulse" />
                            <span className="font-bold text-sm">{stats.streak} day streak! 🔥</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Quick Check-in Card */}
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 shadow-xl w-full sm:w-auto sm:min-w-[240px]"
                      >
                        <p className="text-xs font-bold text-white/90 mb-3 uppercase tracking-wide">Quick Check-in</p>
                        {attendanceStatus === 'not_checked_in' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCheckIn}
                            disabled={attendanceLoading}
                            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-600 rounded-lg font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 text-sm"
                          >
                            {attendanceLoading ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Fingerprint className="w-5 h-5" />
                            )}
                            Check In
                          </motion.button>
                        )}
                        {attendanceStatus === 'checked_in' && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-green-300 bg-white/10 px-3 py-2 rounded-lg">
                              <CheckCircle className="w-5 h-5 flex-shrink-0" />
                              <span className="font-bold text-sm">Checked In ✓</span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleCheckOut}
                              disabled={attendanceLoading}
                              className="w-full flex items-center justify-center gap-2 px-5 py-2 bg-red-500/90 text-white rounded-lg font-bold hover:bg-red-500 transition-all disabled:opacity-50 text-sm"
                            >
                              {attendanceLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOutIcon className="w-4 h-4" />}
                              Check Out
                            </motion.button>
                          </div>
                        )}
                        {attendanceStatus === 'checked_out' && (
                          <div className="flex items-center gap-3 bg-white/10 px-3 py-3 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                            <div>
                              <span className="font-bold block text-sm text-white">Done Today! 🎉</span>
                              {attendanceData?.duration_minutes && (
                                <span className="text-xs text-white/70">{attendanceData.duration_minutes} min</span>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.1 }}
                  className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                >
                  {stats ? [
                    { label: "This Week", value: stats.weeklyWorkouts, icon: Activity, gradient: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', textColor: 'text-blue-400', desc: 'workouts' },
                    { label: 'Total', value: stats.totalWorkouts, icon: Target, gradient: 'from-purple-500 to-pink-500', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', textColor: 'text-purple-400', desc: 'completed' },
                    { label: 'Streak', value: stats.streak, icon: Flame, gradient: 'from-orange-500 to-red-500', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-400', textColor: 'text-orange-400', desc: 'days' },
                    { label: 'Achievements', value: stats.achievements, icon: Trophy, gradient: 'from-yellow-500 to-amber-500', iconBg: 'bg-yellow-500/20', iconColor: 'text-yellow-400', textColor: 'text-yellow-400', desc: 'unlocked' }
                  ].map((stat, i) => {
                    const Icon = stat.icon
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -6, scale: 1.02 }}
                        className={`rounded-2xl p-5 border shadow-lg transition-all duration-300 cursor-pointer group ${isDark
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-indigo-500/10'
                          : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-indigo-500/5'
                          }`}
                      >
                        <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                        </div>
                        <div className={`text-3xl font-extrabold ${stat.textColor} mb-1 transition-colors duration-300`}>{stat.value}</div>
                        <div className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{stat.label}</div>
                        <div className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{stat.desc}</div>
                      </motion.div>
                    )
                  }) : (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className={`h-40 rounded-2xl animate-pulse border transition-colors duration-300 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
                        }`} />
                    ))
                  )}
                </motion.div>

                {/* Quick Insights */}
                {stats && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 border shadow-lg transition-all duration-300 ${isDark
                      ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-800/50'
                      : 'bg-white border-indigo-100'
                      }`}
                  >
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      Today's Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Best Streak</p>
                          <p className={`text-xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.bestStreak || stats.streak} Days</p>
                          <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Keep it up!</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Scale className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Current Weight</p>
                          <p className={`text-xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.currentWeight || '--'} kg</p>
                          <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Track progress</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Avg Form Score</p>
                          <p className={`text-xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.avgFormScore || 0}%</p>
                          <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Technique matters</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* My Training Sessions with Trainer */}
                {(mySchedule.schedule.length > 0 || mySchedule.trainer) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 border shadow-lg transition-all duration-300 ${isDark
                      ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-800/50'
                      : 'bg-white border-purple-100'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h3 className={`text-lg font-bold flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <Calendar className="w-5 h-5 text-purple-400" />
                        My Training Sessions
                      </h3>
                      {mySchedule.trainer && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
                          <User className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-purple-300 font-medium">{mySchedule.trainer.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Today's Session Highlight */}
                    {mySchedule.today_sessions?.length > 0 && (
                      <div className="mb-4 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs font-bold text-green-400 uppercase">Today's Session</span>
                        </div>
                        {mySchedule.today_sessions.map((session, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div>
                              <p className={`font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{session.start_time} - {session.end_time}</p>
                              <p className={`text-sm capitalize transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{session.session_type?.replace('_', ' ')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-green-400">With {session.trainer?.name || mySchedule.trainer?.name}</p>
                              {session.notes && <p className="text-xs text-slate-500">{session.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upcoming Session */}
                    {mySchedule.upcoming_session && !mySchedule.today_sessions?.length && (
                      <div className="mb-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-blue-400 uppercase">Next Session</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{mySchedule.upcoming_session.day_name}</p>
                            <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{mySchedule.upcoming_session.start_time} - {mySchedule.upcoming_session.end_time}</p>
                          </div>
                          <span className="text-sm text-blue-400 capitalize">{mySchedule.upcoming_session.session_type?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    )}

                    {/* Weekly Schedule Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                        const daySessions = mySchedule.schedule.filter(s => s.day_of_week === idx)
                        const isToday = new Date().getDay() === (idx === 6 ? 0 : idx + 1)
                        return (
                          <div
                            key={day}
                            className={`text-center p-2 rounded-lg transition-all duration-300 ${isToday
                              ? 'bg-purple-500/30 ring-2 ring-purple-500'
                              : isDark ? 'bg-slate-800/50' : 'bg-slate-50 border border-slate-100'
                              }`}
                          >
                            <p className={`text-xs font-bold mb-1 transition-colors duration-300 ${isToday
                              ? (isDark ? 'text-purple-300' : 'text-purple-600')
                              : (isDark ? 'text-slate-400' : 'text-slate-500')
                              }`}>{day}</p>
                            {daySessions.length > 0 ? (
                              <div className="space-y-1">
                                {daySessions.map((s, i) => (
                                  <div key={i} className="text-[10px] text-purple-400 font-medium">
                                    {s.start_time}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-600">—</p>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {mySchedule.total_weekly_sessions > 0 && (
                      <p className="text-xs text-slate-400 text-center mt-4">
                        📅 {mySchedule.total_weekly_sessions} session{mySchedule.total_weekly_sessions > 1 ? 's' : ''} per week with your trainer
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Calories & Water Section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
                >
                  {/* Calories Card */}
                  <div className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                    <h3 className={`text-base sm:text-lg font-bold mb-5 flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <Utensils className="w-5 h-5 text-green-400" />
                      Calorie Tracker
                    </h3>
                    {stats ? (
                      <div className="space-y-4">
                        {/* Consumed */}
                        <motion.div whileHover={{ x: 4 }} className="p-4 bg-green-500/10 rounded-xl border border-green-500/30 hover:border-green-500/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Utensils className="w-4 h-4 text-green-400" />
                              </div>
                              <span className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Consumed</span>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-green-400">{stats.calories}</span>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((stats.calories / stats.caloriesBudget) * 100, 100)}%` }}
                              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                            />
                          </div>
                          <p className={`text-xs mt-2 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>of {stats.caloriesBudget} cal budget</p>
                        </motion.div>

                        {/* Burned */}
                        <motion.div whileHover={{ x: 4 }} className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30 hover:border-orange-500/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                <Flame className="w-4 h-4 text-orange-400" />
                              </div>
                              <span className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Burned</span>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-orange-400">{stats.caloriesBurned}</span>
                          </div>
                          <p className={`text-xs mt-2 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>from workouts</p>
                        </motion.div>

                        {/* Remaining */}
                        <motion.div whileHover={{ x: 4 }} className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Target className="w-4 h-4 text-blue-400" />
                              </div>
                              <span className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Remaining</span>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-blue-400">
                              {stats.caloriesBudget - stats.calories + stats.caloriesBurned}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className={`h-16 rounded-xl transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />)}
                      </div>
                    )}
                  </div>

                  {/* Water Card */}
                  <div className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base sm:text-lg font-bold text-cyan-400 flex items-center gap-2">
                        <Droplet className="w-5 h-5" />
                        Water Intake
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={logWater}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-2 font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Glass</span>
                        <span className="sm:hidden">Add</span>
                      </motion.button>
                    </div>
                    {stats ? (
                      <div>
                        <div className="flex items-center justify-center mb-5">
                          <div className="relative">
                            <svg className="w-32 h-32 sm:w-40 sm:h-40 transform -rotate-90" viewBox="0 0 120 120">
                              {/* Background Circle */}
                              <circle cx="60" cy="60" r="54" fill="none" stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="8" />
                              {/* Progress Circle */}
                              <motion.circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="url(#waterGradient)"
                                strokeWidth="8"
                                initial={{ strokeDashoffset: 339.29 }}
                                animate={{
                                  strokeDashoffset: 339.29 * (1 - (stats.waterIntake / stats.waterGoal))
                                }}
                                transition={{ duration: 0.8 }}
                                strokeDasharray="339.29"
                                strokeLinecap="round"
                              />
                              <defs>
                                <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#06B6D4" />
                                  <stop offset="100%" stopColor="#3B82F6" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
                                {typeof stats.waterIntake === 'number' ? stats.waterIntake : '--'}
                              </span>
                              <span className={`text-xs sm:text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/{typeof stats.waterGoal === 'number' ? stats.waterGoal : '--'} glasses</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs sm:text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {stats.waterIntake >= stats.waterGoal
                              ? '🎉 Goal Reached! Great hydration.'
                              : `${stats.waterGoal - stats.waterIntake} more glasses to go`
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`h-40 rounded-xl animate-pulse transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                    )}
                  </div>
                </motion.div>

                {/* Recent Workouts */}
                <div className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <Dumbbell className="w-5 h-5 text-purple-400" />
                      Recent Workouts
                    </h3>
                    <button
                      onClick={() => setActiveTab('progress')}
                      className="text-xs sm:text-sm font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                    >
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {workoutHistory && workoutHistory.length > 0 ? (
                    <div className="space-y-2">
                      {workoutHistory.slice(0, 5).map((workout, index) => (
                        <motion.div
                          key={workout.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all group duration-300 ${isDark
                            ? 'bg-slate-800/50 border-slate-700 hover:border-purple-500/50'
                            : 'bg-slate-50 border-slate-100 hover:border-purple-200 shadow-sm'
                            }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${index === 0 ? 'bg-blue-500/20 text-blue-400' :
                              index === 1 ? 'bg-green-500/20 text-green-400' :
                                index === 2 ? 'bg-purple-500/20 text-purple-400' :
                                  'bg-pink-500/20 text-pink-400'
                              }`}>
                              <Dumbbell className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm sm:text-base transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{workout.type}</p>
                              <p className={`text-xs sm:text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{workout.date}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="font-bold text-purple-400 text-sm sm:text-base">
                              {workout.reps ? `${workout.reps} reps` : workout.duration}
                            </p>
                            <div className="flex items-center gap-2 text-xs sm:text-sm justify-end">
                              {workout.formScore && (
                                <>
                                  <span className="text-green-400 font-medium">{workout.formScore}%</span>
                                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                                </>
                              )}
                              <span className={`transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{workout.calories} cal</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-slate-100'
                        }`}>
                        <Dumbbell className={`w-8 h-8 transition-colors duration-300 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                      </div>
                      <p className={`text-sm mb-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No workouts yet</p>
                      <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Start tracking your fitness journey!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Enhanced Header */}
                <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden">
                  {/* Background Effects */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                            <CalendarCheck className="w-7 h-7" />
                          </div>
                          <div>
                            <h2 className="text-2xl lg:text-3xl font-bold">Gym Attendance</h2>
                            <p className="text-emerald-100 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <p className="text-emerald-100/80 text-sm max-w-md">Track your gym visits and build consistency. Your streak keeps you motivated!</p>
                      </div>

                      {/* Enhanced Check In/Out Card */}
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-2xl min-w-[280px]"
                      >
                        <AnimatePresence mode="wait">
                          {attendanceStatus === 'not_checked_in' && (
                            <motion.div
                              key="not-checked-in"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="text-center"
                            >
                              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Fingerprint className="w-8 h-8 text-white" />
                              </div>
                              <p className="text-white/80 text-sm mb-4">Ready to start your workout?</p>
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleCheckIn}
                                disabled={attendanceLoading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-emerald-600 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 text-base"
                              >
                                {attendanceLoading ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full"
                                    />
                                    Checking In...
                                  </>
                                ) : (
                                  <>
                                    <LogIn className="w-5 h-5" />
                                    Check In Now
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          )}

                          {attendanceStatus === 'checked_in' && (
                            <motion.div
                              key="checked-in"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="text-center"
                            >
                              <div className="flex items-center justify-center gap-2 mb-4">
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="w-3 h-3 bg-green-400 rounded-full"
                                />
                                <span className="text-green-300 font-semibold text-sm">Session Active</span>
                              </div>

                              <div className="mb-4 p-3 bg-white/10 rounded-xl">
                                <p className="text-white/70 text-xs mb-1">Checked in at</p>
                                <p className="text-white font-bold text-lg">
                                  {attendanceData?.check_in_time && new Date(attendanceData.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>

                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleCheckOut}
                                disabled={attendanceLoading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
                              >
                                {attendanceLoading ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-5 h-5 border-2 border-red-200 border-t-white rounded-full"
                                    />
                                    Checking Out...
                                  </>
                                ) : (
                                  <>
                                    <LogOutIcon className="w-5 h-5" />
                                    Check Out
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          )}

                          {attendanceStatus === 'checked_out' && (
                            <motion.div
                              key="checked-out"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="text-center"
                            >
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/30 flex items-center justify-center"
                              >
                                <CheckCircle className="w-8 h-8 text-green-300" />
                              </motion.div>

                              <p className="text-white font-bold text-lg mb-1">Workout Complete! 🎉</p>
                              <p className="text-white/70 text-sm mb-4">Great job today!</p>

                              {attendanceData?.duration_minutes && (
                                <div className="p-4 bg-white/10 rounded-xl">
                                  <p className="text-white/70 text-xs mb-1">Session Duration</p>
                                  <div className="flex items-center justify-center gap-2">
                                    <Timer className="w-5 h-5 text-cyan-300" />
                                    <span className="text-white font-bold text-2xl">{attendanceData.duration_minutes}</span>
                                    <span className="text-white/70">minutes</span>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Today's Status Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Current Status */}
                  <div className={`rounded-2xl p-6 border shadow-xl transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <Clock className="w-5 h-5 text-emerald-500" />
                      Today's Status
                    </h3>
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl transition-all ${attendanceStatus === 'checked_in'
                        ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30'
                        : attendanceStatus === 'checked_out'
                          ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30'
                          : isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'
                        }`}>
                        <div className="flex items-center gap-4">
                          <motion.div
                            animate={attendanceStatus === 'checked_in' ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${attendanceStatus === 'checked_in'
                              ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                              : attendanceStatus === 'checked_out'
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                : isDark ? 'bg-slate-700' : 'bg-slate-200'
                              }`}
                          >
                            {attendanceStatus === 'checked_in' ? (
                              <UserCheck className="w-7 h-7 text-white" />
                            ) : attendanceStatus === 'checked_out' ? (
                              <CheckCircle className="w-7 h-7 text-white" />
                            ) : (
                              <XCircle className="w-7 h-7 text-slate-400" />
                            )}
                          </motion.div>
                          <div>
                            <p className={`font-bold text-lg transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {attendanceStatus === 'checked_in' ? 'At the Gym' :
                                attendanceStatus === 'checked_out' ? 'Session Done' :
                                  'Not Checked In'}
                            </p>
                            {attendanceData?.check_in_time && (
                              <p className={`text-sm flex items-center gap-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <LogIn className="w-3.5 h-3.5 text-green-400" />
                                {new Date(attendanceData.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {attendanceData?.check_out_time && (
                                  <>
                                    <span className="mx-1">→</span>
                                    <LogOutIcon className="w-3.5 h-3.5 text-red-400" />
                                    {new Date(attendanceData.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-lg cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Flame className="w-8 h-8 opacity-80" />
                        {attendanceStats?.current_streak > 0 && (
                          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">🔥</span>
                        )}
                      </div>
                      <p className="text-3xl font-bold">{attendanceStats?.current_streak || 0}</p>
                      <p className="text-emerald-100 text-sm">Day Streak</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-5 text-white shadow-lg cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Calendar className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-3xl font-bold">{attendanceStats?.this_month_visits || 0}</p>
                      <p className="text-blue-100 text-sm">This Month</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-5 text-white shadow-lg cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Trophy className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-3xl font-bold">{attendanceStats?.total_visits || 0}</p>
                      <p className="text-purple-100 text-sm">Total Visits</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-5 text-white shadow-lg cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Timer className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-3xl font-bold">{attendanceStats?.avg_duration || 0}</p>
                      <p className="text-amber-100 text-sm">Avg. Minutes</p>
                    </motion.div>
                  </div>
                </div>

                {/* Attendance History */}
                <div className={`rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                  <div className={`p-5 border-b transition-colors duration-300 ${isDark ? 'border-slate-800 bg-gradient-to-r from-slate-800 to-slate-900' : 'border-slate-100 bg-slate-50'
                    }`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-bold flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <History className="w-5 h-5 text-slate-400" />
                        Recent Visits
                      </h3>
                      <span className={`text-xs px-3 py-1.5 rounded-lg border transition-colors duration-300 ${isDark ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-600 bg-white border-slate-200'
                        }`}>
                        Last 30 days
                      </span>
                    </div>
                  </div>

                  {attendanceHistory.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-slate-100'
                        }`}>
                        <CalendarCheck className={`w-10 h-10 transition-colors duration-300 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                      </div>
                      <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>No attendance records yet</h3>
                      <p className={`text-sm max-w-xs mx-auto transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Start tracking your gym visits by checking in when you arrive!</p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCheckIn}
                        disabled={attendanceLoading || attendanceStatus !== 'not_checked_in'}
                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
                      >
                        <Fingerprint className="w-5 h-5" />
                        Check In Now
                      </motion.button>
                    </div>
                  ) : (
                    <div className={`divide-y transition-colors duration-300 ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {attendanceHistory.slice(0, 10).map((record, idx) => {
                        const checkInDate = new Date(record.check_in_time || record.date);
                        const isToday = checkInDate.toDateString() === new Date().toDateString();

                        return (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ backgroundColor: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(241, 245, 249, 1)' }}
                            className="p-4 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                {/* Date Icon */}
                                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shadow-lg ${isToday
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                                  : idx === 0
                                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                    : isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'
                                  }`}>
                                  <span className={`text-lg font-bold transition-colors duration-300 ${isToday || idx === 0 ? 'text-white' : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>
                                    {checkInDate.getDate()}
                                  </span>
                                  <span className={`text-[10px] uppercase transition-colors duration-300 ${isToday || idx === 0 ? 'text-white/80' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                                    {checkInDate.toLocaleDateString('en-US', { month: 'short' })}
                                  </span>
                                </div>

                                {/* Details */}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className={`font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      {checkInDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                    </p>
                                    {isToday && (
                                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
                                        Today
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <LogIn className="w-3.5 h-3.5 text-green-400" />
                                      {record.check_in_time && new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {record.check_out_time && (
                                      <>
                                        <span className="text-slate-600">→</span>
                                        <span className="flex items-center gap-1">
                                          <LogOutIcon className="w-3.5 h-3.5 text-red-400" />
                                          {new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Duration Badge */}
                              <div className="text-right">
                                {record.duration_minutes ? (
                                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'
                                    }`}>
                                    <Timer className="w-4 h-4 text-cyan-400" />
                                    <span className={`font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{record.duration_minutes}</span>
                                    <span className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>min</span>
                                  </div>
                                ) : (
                                  <span className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium border border-amber-500/30 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    In Progress
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* View More */}
                  {attendanceHistory.length > 10 && (
                    <div className="p-4 border-t border-slate-800 bg-slate-800/30">
                      <button className="w-full py-2.5 text-center text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/50 rounded-lg transition-all flex items-center justify-center gap-2">
                        View all {attendanceHistory.length} records
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Monthly Attendance Calendar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-6 shadow-xl border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      Monthly Attendance
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className={`rounded-xl p-4 border transition-all duration-300 ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    {/* Days Header */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                      {(() => {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = now.getMonth();
                        const firstDay = new Date(year, month, 1);
                        const lastDay = new Date(year, month + 1, 0);
                        const daysInMonth = lastDay.getDate();
                        const startingDayOfWeek = firstDay.getDay();
                        const today = now.getDate();

                        // Create a set of attended dates from real attendance history
                        const attendedDates = new Set();
                        attendanceHistory.forEach(record => {
                          if (record.date || record.check_in_time) {
                            const dateStr = record.date || record.check_in_time?.split('T')[0];
                            if (dateStr) {
                              const recordDate = new Date(dateStr);
                              // Only include dates from current month
                              if (recordDate.getFullYear() === year && recordDate.getMonth() === month) {
                                attendedDates.add(recordDate.getDate());
                              }
                            }
                          }
                        });

                        const days = [];

                        // Empty cells for days before month starts
                        for (let i = 0; i < startingDayOfWeek; i++) {
                          days.push(<div key={`empty-${i}`} className="h-10" />);
                        }

                        // Days of month
                        for (let day = 1; day <= daysInMonth; day++) {
                          const isToday = day === today;
                          const isCheckedIn = attendedDates.has(day);
                          const isFutureDay = day > today;

                          days.push(
                            <motion.div
                              key={day}
                              whileHover={{ scale: !isFutureDay ? 1.1 : 1 }}
                              className={`h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 ${isCheckedIn
                                ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20'
                                : isToday
                                  ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/50'
                                  : isFutureDay
                                    ? (isDark ? 'bg-slate-800/30 text-slate-600' : 'bg-slate-100/50 text-slate-300') + ' cursor-default'
                                    : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                                }`}
                              title={isCheckedIn ? 'Attended' : isToday ? 'Today' : isFutureDay ? 'Upcoming' : 'Missed'}
                            >
                              {day}
                            </motion.div>
                          );
                        }

                        return days;
                      })()}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-500 shadow" />
                      <span className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Checked In</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-blue-600 ring-2 ring-indigo-400/50" />
                      <span className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded shadow-inner transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'}`} />
                      <span className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Not Checked</span>
                    </div>
                  </div>

                  {/* Monthly Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <motion.div
                      whileHover={{ y: -2, scale: 1.02 }}
                      className={`rounded-xl p-4 border text-center cursor-pointer transition-all duration-300 shadow-sm ${isDark ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20' : 'bg-green-50 border-green-100'
                        }`}
                    >
                      <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-green-400" />
                      </div>
                      <p className="text-2xl font-bold text-green-400">
                        {attendanceStats?.current_streak || 0}
                      </p>
                      <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Streak</p>
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -2, scale: 1.02 }}
                      className={`rounded-xl p-4 border text-center cursor-pointer transition-all duration-300 shadow-sm ${isDark ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'
                        }`}
                    >
                      <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-400" />
                      </div>
                      <p className="text-2xl font-bold text-indigo-400">
                        {attendanceStats?.this_month_visits || attendanceHistory?.filter(r => {
                          const d = new Date(r.date || r.check_in_time);
                          const now = new Date();
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length || 0}
                      </p>
                      <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>This Month</p>
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -2, scale: 1.02 }}
                      className={`rounded-xl p-4 border text-center cursor-pointer transition-all duration-300 shadow-sm ${isDark ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-100'
                        }`}
                    >
                      <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-bold text-cyan-400">
                        {attendanceStats?.best_streak || attendanceStats?.current_streak || 0}
                      </p>
                      <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Best Streak</p>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Motivational Card */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Keep the Momentum! 💪</h3>
                      <p className="text-white/80">
                        {attendanceStats?.current_streak >= 7
                          ? "Amazing! You've been consistent for a week. Keep pushing!"
                          : attendanceStats?.current_streak >= 3
                            ? "Great progress! A few more days to build a solid streak."
                            : "Every visit counts. Start your streak today!"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Nutrition Tab - Real AI-powered nutrition tracker */}
            {activeTab === 'nutrition' && <NutritionTracker />}

            {/* Progress Tab - Using Simplified Progress Tracker */}
            {activeTab === 'progress' && (
              <ProgressTracker />
            )}

            {/* AI Coach Tab - Using Enhanced AIChatbot */}
            {activeTab === 'coach' && (
              <AIChatbot />
            )}

            {/* Payment Tab - Enhanced with Razorpay */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-8 h-8" />
                      <h2 className="text-2xl lg:text-3xl font-bold">Choose Your Plan</h2>
                    </div>
                    <p className="text-indigo-100">Select the perfect plan for your fitness journey</p>
                  </div>
                </div>

                {/* Current Membership Status */}
                {currentMembership && (
                  <div className={`rounded-2xl p-5 border transition-all duration-300 ${isDark ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30' : 'bg-green-50 border-green-100 shadow-sm'
                    }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-green-400">Active Membership</h3>
                        <p className={`transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {currentMembership.membership_type} • {currentMembership.days_remaining} days remaining
                        </p>
                        <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Expires: {new Date(currentMembership.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plans Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {plans.length === 0 ? (
                    <div className={`col-span-full text-center py-12 rounded-2xl border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                      <CreditCard className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                      <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>No Plans Available</h3>
                      <p className={`transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Contact admin to add membership plans</p>
                    </div>
                  ) : (
                    plans.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-xl ${selectedPlan === plan.id
                          ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                          : isDark ? 'border-slate-800 hover:border-purple-500/50 bg-slate-900' : 'border-slate-100 hover:border-purple-500/30 bg-white shadow-sm'
                          }`}
                      >
                        {/* Popular Badge */}
                        {index === 1 && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-bold shadow-lg">
                            Most Popular
                          </div>
                        )}

                        <div className="text-center mb-6">
                          <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 transition-colors duration-300 ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {plan.name}
                          </div>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className={`text-4xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{plan.price?.toLocaleString()}</span>
                            <span className={`transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/{plan.duration_months} mo</span>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-8">
                          {(plan.features || []).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-green-400" />
                              </div>
                              <span className={`transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                            </li>
                          ))}
                          {(!plan.features || plan.features.length === 0) && (
                            <>
                              <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 text-green-400" />
                                </div>
                                <span className={`transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Full gym access</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 text-green-400" />
                                </div>
                                <span className={`transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>AI workout tracking</span>
                              </li>
                            </>
                          )}
                        </ul>

                        <button
                          onClick={() => handlePurchasePlan(plan)}
                          disabled={paymentLoading && selectedPlan === plan.id}
                          className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${paymentLoading && selectedPlan === plan.id
                            ? 'bg-gray-600 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
                            }`}
                        >
                          {paymentLoading && selectedPlan === plan.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              {currentMembership ? 'Extend' : 'Subscribe Now'}
                            </>
                          )}
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Payment Security Note */}
                <div className={`rounded-xl p-4 text-center border transition-all duration-300 ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <p className={`text-sm flex items-center justify-center gap-2 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Shield className="w-4 h-4" />
                    Secure payments powered by Razorpay. Your payment information is encrypted.
                  </p>
                </div>
              </div>
            )}

            {/* Messages Tab - Enhanced */}
            {activeTab === 'messages' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Messages</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-teal-100">Chat with your trainer or admin</p>
                    {unreadCount > 0 && (
                      <div className="mt-2 sm:mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/30">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        <span className="text-xs sm:text-sm font-medium">{unreadCount} unread</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Contacts / Conversations List */}
                  <div className={`rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                    <div className={`p-3 sm:p-4 border-b sticky top-0 z-10 transition-colors duration-300 ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'
                      }`}>
                      <h3 className={`text-sm sm:text-base font-semibold flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-teal-400" />
                        </div>
                        <span>Conversations</span>
                        {conversations.length > 0 && (
                          <span className="ml-auto text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">{conversations.length}</span>
                        )}
                      </h3>
                    </div>
                    <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                      {/* Existing Conversations */}
                      {conversations.map((conv) => (
                        <button
                          key={conv.user_id}
                          onClick={() => selectConversation({ id: conv.user_id, name: conv.user_name, role: conv.user_role })}
                          className={`w-full p-3 sm:p-4 flex items-center gap-3 transition-all border-b last:border-0 ${selectedConversation?.id === conv.user_id
                            ? (isDark ? 'bg-teal-900/30 border-l-4 border-l-teal-500' : 'bg-teal-50 border-l-4 border-l-teal-500')
                            : (isDark ? 'hover:bg-slate-800/50 border-slate-800' : 'hover:bg-slate-50 border-slate-100')
                            }`}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md">
                              {conv.user_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            {conv.unread_count > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center animate-pulse border-2 border-slate-900 font-bold">
                                {conv.unread_count > 9 ? '9+' : conv.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className={`font-semibold text-sm sm:text-base truncate transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{conv.user_name}</p>
                              <span className="text-[10px] text-teal-400 bg-teal-500/20 px-2 py-0.5 rounded-full flex-shrink-0">{conv.user_role}</span>
                            </div>
                            <p className={`text-xs truncate transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{conv.last_message || 'No messages yet'}</p>
                          </div>
                        </button>
                      ))}

                      {/* New Contacts */}
                      {contacts.filter(c => !conversations.find(conv => conv.user_id === c.id)).length > 0 && (
                        <div className={`p-3 transition-colors duration-300 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50/50'}`}>
                          <p className={`text-xs mb-2 font-medium transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Start a new conversation</p>
                          {contacts.filter(c => !conversations.find(conv => conv.user_id === c.id)).map((contact) => (
                            <button
                              key={contact.id}
                              onClick={() => selectConversation(contact)}
                              className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors mb-1 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100 border border-transparent hover:border-slate-200'
                                }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-xs">
                                {contact.name?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1 text-left">
                                <p className={`font-medium text-sm transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{contact.name}</p>
                                <span className={`text-[10px] transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{contact.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {conversations.length === 0 && contacts.length === 0 && (
                        <div className="p-6 text-center text-slate-500">
                          <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No contacts available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className={`lg:col-span-2 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden flex flex-col h-[500px] sm:h-[600px] border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                    {selectedConversation ? (
                      <>
                        {/* Chat Header */}
                        <div className={`p-3 sm:p-4 border-b transition-colors duration-300 bg-gradient-to-r from-teal-500 to-cyan-500 text-white sticky top-0 z-10 ${isDark ? 'border-teal-800' : 'border-teal-400'
                          }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-sm sm:text-base shadow-md">
                              {selectedConversation.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base truncate">{selectedConversation.name}</p>
                              <p className="text-xs text-teal-100 truncate">{selectedConversation.role || selectedConversation.label}</p>
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 transition-colors duration-300 ${isDark ? 'bg-slate-950/50' : 'bg-slate-50/30'}`}>
                          {messagesLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Loading messages...</p>
                              </div>
                            </div>
                          ) : conversationMessages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-slate-400 p-4">
                                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="font-medium">No messages yet</p>
                                <p className="text-xs text-slate-500 mt-1">Start the conversation!</p>
                              </div>
                            </div>
                          ) : (
                            conversationMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl ${msg.is_mine
                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-md shadow-md'
                                    : isDark
                                      ? 'bg-slate-800 text-white rounded-bl-md shadow-sm border border-slate-700'
                                      : 'bg-white text-slate-900 rounded-bl-md shadow-sm border border-slate-100'
                                    }`}
                                >
                                  <p className="text-sm sm:text-base break-words">{msg.message}</p>
                                  <p className={`text-[10px] mt-1.5 transition-colors duration-300 ${msg.is_mine ? 'text-teal-100' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className={`p-3 sm:p-4 border-t transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                          <div className="flex items-end gap-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                              placeholder="Type a message..."
                              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                }`}
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim()}
                              className="p-2.5 sm:p-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all active:scale-95 flex-shrink-0"
                            >
                              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2">Press Enter to send</p>
                        </div>
                      </>
                    ) : (
                      <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-slate-950/50 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                        <div className="text-center">
                          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">Select a conversation</p>
                          <p className="text-sm">Choose someone to chat with</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab - Enhanced Component */}
            {activeTab === 'profile' && (
              <>
                <TraineeProfile />
                <FeedbackButton />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default TraineeDashboard