import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
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
  UserCheck, LogIn, LogOut as LogOutIcon, History, CalendarCheck, Fingerprint, Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import EnhancedProgressTracker from '../../components/progress/EnhancedProgressTracker'
import TraineeProfile from '../../components/trainee/TraineeProfile'
import AIChatbot from '../../components/chat/AIChatbot'
import NutritionTracker from '../../components/nutrition/NutritionTracker'
import { MetricCard, DashboardCard, SectionHeader, LoadingSpinner, EmptyState, AlertBox } from '../../components/ui/DashboardComponents'
import FeedbackButton from '../../components/ui/FeedbackButton'

const TraineeDashboard = () => {
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false) // Closed by default on mobile
  const [workoutActive, setWorkoutActive] = useState(false)
  const [workoutCount, setWorkoutCount] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState('push-ups')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
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
      // Combine notifications from various sources
      const notificationList = [
        // Messages from trainers/admin
        ...(conversations || []).map(conv => ({
          id: `msg-${conv.user_id}`,
          type: 'message',
          title: `Message from ${conv.user_name || 'Trainer'}`,
          message: conv.last_message || 'New message',
          timestamp: conv.last_message_time,
          icon: MessageCircle
        })),
        // Additional notifications can be added here
      ];
      setNotifications(notificationList);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setNotificationsLoading(false);
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
    } catch {}
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
    { id: 'progress', label: 'Progress', icon: BarChart, color: 'text-orange-600 bg-orange-50' },
    { id: 'coach', label: 'AI Coach', icon: MessageCircle, color: 'text-pink-600 bg-pink-50' },
    { id: 'messages', label: 'Messages', icon: Mail, color: 'text-teal-600 bg-teal-50' },
    { id: 'payment', label: 'Plans', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'profile', label: 'Profile', icon: User, color: 'text-gray-600 bg-gray-50' }
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
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Loading Dashboard</h2>
          <p className="text-gray-600 text-center text-sm">Getting your fitness data ready...</p>
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
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Dashboard Unavailable</h2>
          <p className="text-gray-600 mb-6 text-center text-sm">
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
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm border border-gray-200" 
            >
              Logout
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden transition-colors duration-200"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-primary-600" /> : <Menu className="w-5 h-5 text-primary-600" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <span className="text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent tracking-wide">
                    FitMate
                  </span>
                  <p className="text-[10px] sm:text-xs text-primary-600 font-semibold tracking-wider hidden xs:block">
                    Trainee Portal
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notifications Bell */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* User Profile */}
              {userData && (
                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-700">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {userData.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] sm:text-xs text-primary-600 font-semibold">
                      {userData.plan || 'Member'}
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-lg">
                    {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 btn-danger text-xs sm:text-sm font-bold"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-4 sm:right-6 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 border border-gray-200 dark:border-gray-700 max-h-[500px] flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-t-2xl">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" />
                Notifications
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications.map((notif, idx) => (
                    <motion.div
                      key={notif.id || idx}
                      whileHover={{ x: 4 }}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notif.type === 'message' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        }`}>
                          {notif.type === 'message' ? (
                            <MessageCircle className="w-5 h-5" />
                          ) : (
                            <Calendar className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{notif.title}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 truncate">{notif.message}</p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                            {notif.timestamp ? new Date(notif.timestamp).toLocaleString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Bottom Mobile Tab Bar */}
        <div className="lg:hidden flex items-center justify-around px-1 py-2 bg-white/95 dark:bg-gray-800/95 border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
          {navTabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 whitespace-nowrap text-xs ${
                  isActive 
                    ? 'text-primary-600 bg-primary-50 border border-primary-200' 
                    : 'text-gray-500 hover:text-primary-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="mt-0.5 font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex pt-[88px] sm:pt-[100px] lg:pt-20">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 pt-[88px] sm:pt-[100px] lg:pt-0
          ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 h-full overflow-y-auto">
            {/* Navigation Section */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 tracking-wider uppercase">Navigation</h2>
              <nav className="space-y-2">
                {navTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setActiveTab(tab.id)
                        if (window.innerWidth < 1024) setSidebarOpen(false)
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold border border-primary-200 dark:border-primary-700/50 shadow-sm' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{tab.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </motion.button>
                  )
                })}
              </nav>
            </div>

            {/* Quick Stats Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-5 border border-primary-100 dark:border-primary-700/30 shadow-sm"
            >
              <h3 className="font-bold text-primary-700 mb-4 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4" />
                Today's Summary
              </h3>
              {stats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-primary-300 transition-colors">
                    <span className="text-xs text-gray-600">Calories Left</span>
                    <span className="font-bold text-lg text-primary-600">
                      {typeof stats.caloriesBudget === 'number' && typeof stats.calories === 'number' && typeof stats.caloriesBurned === 'number' 
                        ? (stats.caloriesBudget - stats.calories + stats.caloriesBurned) 
                        : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-300 transition-colors">
                    <span className="text-xs text-gray-600">Water</span>
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-lg text-blue-600">
                        {typeof stats.waterIntake === 'number' ? stats.waterIntake : '--'}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-500 text-sm">
                        {typeof stats.waterGoal === 'number' ? stats.waterGoal : '--'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 hover:border-orange-300 transition-colors">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Streak</span>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                        {typeof stats.streak === 'number' ? stats.streak : '--'} days
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="p-3 sm:p-6 max-w-7xl mx-auto">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5 sm:space-y-6">
                {/* Welcome Card with Check-in */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                  
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl sm:text-4xl">💪</span>
                          <h1 className="text-xl sm:text-3xl font-extrabold">
                            Welcome back, {userData ? userData.name.split(' ')[0] : 'Champ'}!
                          </h1>
                        </div>
                        <p className="text-primary-100 text-sm sm:text-base font-medium">
                          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        {stats?.streak > 0 && (
                          <motion.div 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 hover:bg-white/30 transition-all"
                          >
                            <Flame className="w-5 h-5 text-yellow-300 animate-pulse" />
                            <span className="font-bold text-sm">{stats.streak} day streak! 🔥</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Quick Check-in Card */}
                      <motion.div 
                        whileHover={{ y: -4 }}
                        className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/30 shadow-xl w-full sm:w-auto sm:min-w-[240px]"
                      >
                        <p className="text-xs sm:text-sm text-primary-100 mb-3 font-bold uppercase tracking-wide">Quick Check-in</p>
                        {attendanceStatus === 'not_checked_in' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCheckIn}
                            disabled={attendanceLoading}
                            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-primary-600 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 text-sm sm:text-base"
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
                              className="w-full flex items-center justify-center gap-2 px-5 py-2 bg-red-500/90 text-white rounded-xl font-bold hover:bg-red-500 transition-all disabled:opacity-50 text-xs sm:text-sm"
                            >
                              {attendanceLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOutIcon className="w-4 h-4" />}
                              Check Out
                            </motion.button>
                          </div>
                        )}
                        {attendanceStatus === 'checked_out' && (
                          <div className="flex items-center gap-3 bg-white/10 px-3 py-3 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                            <div>
                              <span className="font-bold block text-sm text-white">Done Today! 🎉</span>
                              {attendanceData?.duration_minutes && (
                                <span className="text-xs text-primary-200">{attendanceData.duration_minutes} min</span>
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
                    { label: "This Week", value: stats.weeklyWorkouts, icon: Activity, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Total', value: stats.totalWorkouts, icon: Target, color: 'from-purple-500 to-pink-500' },
                    { label: 'Streak', value: stats.streak, icon: Flame, color: 'from-orange-500 to-red-500' },
                    { label: 'Achievements', value: stats.achievements, icon: Trophy, color: 'from-green-500 to-emerald-500' }
                  ].map((stat, i) => {
                    const Icon = stat.icon
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -4 }}
                        className="dashboard-card p-4 transition-all"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stat.value}</div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">{stat.label}</div>
                      </motion.div>
                    )
                  }) : (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                    ))
                  )}
                </motion.div>

                {/* Calories & Water Section */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
                >
                  {/* Calories Card */}
                  <DashboardCard className="p-5 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-primary-600" />
                      Calorie Tracker
                    </h3>
                    {stats ? (
                      <div className="space-y-4">
                        {/* Consumed */}
                        <motion.div whileHover={{ x: 4 }} className="p-4 bg-green-50 rounded-xl border border-green-100 hover:border-green-300 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center border border-green-200">
                                <Utensils className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-xs sm:text-sm text-gray-700 font-medium">Consumed</span>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-green-600">{stats.calories}</span>
                          </div>
                          <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((stats.calories / stats.caloriesBudget) * 100, 100)}%` }}
                              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">of {stats.caloriesBudget} cal budget</p>
                        </motion.div>

                        {/* Burned */}
                        <motion.div whileHover={{ x: 4 }} className="p-4 bg-orange-50 rounded-xl border border-orange-100 hover:border-orange-300 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center border border-orange-200">
                                <Flame className="w-4 h-4 text-orange-600" />
                              </div>
                              <span className="text-xs sm:text-sm text-gray-700 font-medium">Burned</span>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-orange-600">{stats.caloriesBurned}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">from workouts</p>
                        </motion.div>

                        {/* Remaining */}
                        <motion.div whileHover={{ x: 4 }} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200">
                                <Target className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-xs sm:text-sm text-gray-700 font-medium">Remaining</span>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-blue-600">
                              {stats.caloriesBudget - stats.calories + stats.caloriesBurned}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
                      </div>
                    )}
                  </DashboardCard>

                  {/* Water Card */}
                  <DashboardCard className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base sm:text-lg font-bold text-blue-600 flex items-center gap-2">
                        <Droplet className="w-5 h-5" />
                        Water Intake
                      </h3>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={logWater}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 btn-primary text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
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
                              <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
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
                                  <stop offset="0%" stopColor="#3B82F6" />
                                  <stop offset="100%" stopColor="#06B6D4" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                                {typeof stats.waterIntake === 'number' ? stats.waterIntake : '--'}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-500">/{typeof stats.waterGoal === 'number' ? stats.waterGoal : '--'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs sm:text-sm text-gray-500">
                            {stats.waterIntake >= stats.waterGoal 
                              ? '🎉 Goal Reached! Great hydration.' 
                              : `${stats.waterGoal - stats.waterIntake} more glasses to go`
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                    )}
                  </DashboardCard>
                </motion.div>

                {/* Recent Workouts */}
                <DashboardCard className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary-600" />
                      Recent Workouts
                    </h3>
                    <button className="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {workoutHistory && workoutHistory.length > 0 ? (
                    <div className="space-y-2">
                      {workoutHistory.slice(0, 5).map((workout, index) => (
                        <motion.div 
                          key={workout.id} 
                          whileHover={{ x: 4 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary-400 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              index === 0 ? 'bg-blue-100 text-blue-600' :
                              index === 1 ? 'bg-green-100 text-green-600' :
                              index === 2 ? 'bg-orange-100 text-orange-600' :
                              'bg-purple-100 text-purple-600'
                            }`}>
                              <Dumbbell className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">{workout.type}</p>
                              <p className="text-xs sm:text-sm text-gray-500">{workout.date}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="font-bold text-primary-600 text-sm sm:text-base">
                              {workout.reps ? `${workout.reps} reps` : workout.duration}
                            </p>
                            <div className="flex items-center gap-2 text-xs sm:text-sm justify-end">
                              <span className="text-green-600 font-medium">Form: {workout.formScore}%</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">{workout.calories} cal</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Dumbbell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">No workouts yet. Start tracking!</p>
                    </div>
                  )}
                </DashboardCard>
              </div>
            )}
            
            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-green-500 via-teal-500 to-cyan-500 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div>
                        <h2 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-3">
                          <CalendarCheck className="w-8 h-8" />
                          Gym Attendance
                        </h2>
                        <p className="text-emerald-100">Track your gym visits and build consistency</p>
                      </div>
                      
                      {/* Quick Check In/Out Button */}
                      <div className="flex flex-col items-center">
                        {attendanceStatus === 'not_checked_in' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCheckIn}
                            disabled={attendanceLoading}
                            className="flex items-center gap-3 px-8 py-4 bg-white text-emerald-600 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
                          >
                            {attendanceLoading ? (
                              <RefreshCw className="w-6 h-6 animate-spin" />
                            ) : (
                              <Fingerprint className="w-6 h-6" />
                            )}
                            Check In Now
                          </motion.button>
                        )}
                        {attendanceStatus === 'checked_in' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCheckOut}
                            disabled={attendanceLoading}
                            className="flex items-center gap-3 px-8 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
                          >
                            {attendanceLoading ? (
                              <RefreshCw className="w-6 h-6 animate-spin" />
                            ) : (
                              <LogOutIcon className="w-6 h-6" />
                            )}
                            Check Out
                          </motion.button>
                        )}
                        {attendanceStatus === 'checked_out' && (
                          <div className="text-center">
                            <div className="flex items-center gap-2 px-6 py-3 bg-white/20 rounded-xl">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">Completed Today</span>
                            </div>
                            {attendanceData?.duration_minutes && (
                              <p className="mt-2 text-emerald-100 text-sm">
                                Duration: {attendanceData.duration_minutes} minutes
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Status Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Current Status */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-500" />
                      Today's Status
                    </h3>
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl ${
                        attendanceStatus === 'checked_in' 
                          ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30' 
                          : attendanceStatus === 'checked_out'
                          ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30'
                          : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                            attendanceStatus === 'checked_in' 
                              ? 'bg-green-500' 
                              : attendanceStatus === 'checked_out'
                              ? 'bg-blue-500'
                              : 'bg-gray-400 dark:bg-gray-600'
                          }`}>
                            {attendanceStatus === 'checked_in' ? (
                              <UserCheck className="w-6 h-6 text-white" />
                            ) : attendanceStatus === 'checked_out' ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                              <XCircle className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {attendanceStatus === 'checked_in' ? 'Currently at Gym' :
                               attendanceStatus === 'checked_out' ? 'Session Completed' :
                               'Not Checked In'}
                            </p>
                            {attendanceData?.check_in_time && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Check-in: {new Date(attendanceData.check_in_time).toLocaleTimeString()}
                              </p>
                            )}
                            {attendanceData?.check_out_time && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Check-out: {new Date(attendanceData.check_out_time).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <Flame className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-3xl font-bold">{attendanceStats?.current_streak || 0}</p>
                      <p className="text-emerald-100 text-sm">Day Streak</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <Calendar className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-3xl font-bold">{attendanceStats?.this_month_visits || 0}</p>
                      <p className="text-blue-100 text-sm">This Month</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <Trophy className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-3xl font-bold">{attendanceStats?.total_visits || 0}</p>
                      <p className="text-purple-100 text-sm">Total Visits</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <Timer className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-3xl font-bold">{attendanceStats?.avg_duration || 0}</p>
                      <p className="text-orange-100 text-sm">Avg. Minutes</p>
                    </div>
                  </div>
                </div>

                {/* Attendance History */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-white dark:to-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      Recent Visits
                    </h3>
                  </div>
                  
                  {attendanceHistory.length === 0 ? (
                    <div className="p-12 text-center">
                      <CalendarCheck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No attendance records yet</h3>
                      <p className="text-gray-400 dark:text-gray-500">Start tracking your gym visits by checking in!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {attendanceHistory.slice(0, 10).map((record, idx) => (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                                idx === 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-500' :
                                idx === 1 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                                'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700'
                              }`}>
                                <CalendarCheck className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {new Date(record.date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {record.check_in_time && new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {record.check_out_time && ` - ${new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {record.duration_minutes ? (
                                <div className="flex items-center gap-2">
                                  <Timer className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                  <span className="font-bold text-gray-900 dark:text-white">{record.duration_minutes} min</span>
                                </div>
                              ) : (
                                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
                                  In Progress
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Monthly Attendance Calendar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      Monthly Attendance
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2">
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
                        
                        const days = [];
                        
                        // Empty cells for days before month starts
                        for (let i = 0; i < startingDayOfWeek; i++) {
                          days.push(<div key={`empty-${i}`} className="h-10" />);
                        }
                        
                        // Days of month
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(year, month, day);
                          const isToday = date.toDateString() === new Date().toDateString();
                          // Mock attendance: show checked in for random days
                          const isCheckedIn = Math.random() > 0.6;
                          
                          days.push(
                            <motion.div
                              key={day}
                              whileHover={{ scale: 1.05 }}
                              className={`h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                                isCheckedIn
                                  ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg'
                                  : isToday
                                  ? 'bg-primary-600 text-white border border-primary-400 shadow-md'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                              title={isCheckedIn ? 'Checked In' : isToday ? 'Today' : 'Not checked in'}
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
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Checked In</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-primary-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Not Checked</span>
                    </div>
                  </div>

                  {/* Monthly Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="bg-green-50 dark:bg-green-500/10 rounded-lg p-3 border border-green-200 dark:border-green-500/30 text-center"
                    >
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {attendanceStats?.current_streak || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current Streak</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="bg-primary-50 dark:bg-primary-500/10 rounded-lg p-3 border border-primary-200 dark:border-primary-500/30 text-center"
                    >
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {attendanceHistory?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Visits</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="bg-cyan-50 dark:bg-cyan-500/10 rounded-lg p-3 border border-cyan-200 dark:border-cyan-500/30 text-center"
                    >
                      <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                        {attendanceStats?.best_streak || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Best Streak</p>
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

            {/* Progress Tab - Using Enhanced Progress Tracker */}
            {activeTab === 'progress' && (
              <EnhancedProgressTracker />
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
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-500/50 dark:border-green-500/30 rounded-2xl p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-green-700 dark:text-green-400">Active Membership</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {currentMembership.membership_type} • {currentMembership.days_remaining} days remaining
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Expires: {new Date(currentMembership.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plans Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {plans.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                      <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Plans Available</h3>
                      <p className="text-gray-400 dark:text-gray-500">Contact admin to add membership plans</p>
                    </div>
                  ) : (
                    plans.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-xl ${
                          selectedPlan === plan.id
                            ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500/50'
                        }`}
                      >
                        {/* Popular Badge */}
                        {index === 1 && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-bold shadow-lg">
                            Most Popular
                          </div>
                        )}
                        
                        <div className="text-center mb-6">
                          <div className="inline-block px-4 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                            {plan.name}
                          </div>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">₹{plan.price?.toLocaleString()}</span>
                            <span className="text-gray-500 dark:text-gray-400">/{plan.duration_months} mo</span>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-8">
                          {(plan.features || []).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                            </li>
                          ))}
                          {(!plan.features || plan.features.length === 0) && (
                            <>
                              <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">Full gym access</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">AI workout tracking</span>
                              </li>
                            </>
                          )}
                        </ul>

                        <button
                          onClick={() => handlePurchasePlan(plan)}
                          disabled={paymentLoading && selectedPlan === plan.id}
                          className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                            paymentLoading && selectedPlan === plan.id
                              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
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
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Secure payments powered by Razorpay. Your payment information is encrypted.
                  </p>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-3xl p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="w-8 h-8" />
                      <h2 className="text-2xl lg:text-3xl font-bold">Messages</h2>
                    </div>
                    <p className="text-teal-100">Chat with your trainer or admin</p>
                    {unreadCount > 0 && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        <span className="text-sm font-medium">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Contacts / Conversations List */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-500" />
                        Conversations
                      </h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {/* Existing Conversations */}
                      {conversations.map((conv) => (
                        <button
                          key={conv.user_id}
                          onClick={() => selectConversation({ id: conv.user_id, name: conv.user_name, role: conv.user_role })}
                          className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                            selectedConversation?.id === conv.user_id ? 'bg-teal-50 dark:bg-teal-900/20' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {conv.user_name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-800 dark:text-white">{conv.user_name}</p>
                              {conv.unread_count > 0 && (
                                <span className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-pulse">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.last_message || 'No messages yet'}</p>
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">{conv.user_role}</span>
                          </div>
                        </button>
                      ))}
                      
                      {/* New Contacts */}
                      {contacts.filter(c => !conversations.find(conv => conv.user_id === c.id)).length > 0 && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Start a new conversation</p>
                          {contacts.filter(c => !conversations.find(conv => conv.user_id === c.id)).map((contact) => (
                            <button
                              key={contact.id}
                              onClick={() => selectConversation(contact)}
                              className="w-full p-3 flex items-center gap-3 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors mb-1"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold text-xs">
                                {contact.name?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-gray-700 dark:text-gray-200 text-sm">{contact.name}</p>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">{contact.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {conversations.length === 0 && contacts.length === 0 && (
                        <div className="p-6 text-center text-gray-400 dark:text-gray-500">
                          <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No contacts available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col h-[600px] border border-gray-200 dark:border-gray-700">
                    {selectedConversation ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                              {selectedConversation.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-semibold">{selectedConversation.name}</p>
                              <p className="text-xs text-teal-100">{selectedConversation.role || selectedConversation.label}</p>
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                          {messagesLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
                            </div>
                          ) : conversationMessages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                              <p>No messages yet. Start the conversation!</p>
                            </div>
                          ) : (
                            conversationMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] p-3 rounded-2xl ${
                                    msg.is_mine
                                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-md shadow-md'
                                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700'
                                  }`}
                                >
                                  <p className="text-sm">{msg.message}</p>
                                  <p className={`text-[10px] mt-1 ${msg.is_mine ? 'text-teal-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Type a message..."
                              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim()}
                              className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50">
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