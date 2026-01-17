import { useEffect, useState } from 'react';
import { adminApi } from '../../../utils/api';
import {
  UserPlus, Edit, Trash2, Search, Filter, Eye,
  X, User, Activity, Calendar, DollarSign, Users, Lock, Heart, MapPin, Phone as PhoneIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const TraineeManagement = () => {
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState({ members: false, trainers: false, plans: false });
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTrainees, setSelectedTrainees] = useState(new Set());
  const [isEditMode, setIsEditMode] = useState(false);

  // Create/Edit trainee form - Enhanced
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    trainer_id: "",
    membership_plan_id: "",
    date_of_birth: "",
    gender: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    health_conditions: "",
    fitness_goals: "",
  });

  // Details drawer state
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState('profile');

  // Password reset state
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetTarget, setPasswordResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  /* ============================
        LOAD MEMBERS
     ============================ */
  const loadMembers = async (force = false) => {
    if (loaded.members && !force) return;
    
    try {
      setLoading(true);
      const res = await adminApi.getMembers();
      setMembers(res.data.members || []);
      setLoaded(prev => ({ ...prev, members: true }));
    } catch (err) {
      console.error(err);
      if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout. Try again.');
      } else {
        toast.error(err.message || "Failed to load trainees");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ============================
        LOAD TRAINERS
     ============================ */
  const loadTrainers = async (force = false) => {
    if (loaded.trainers && !force) return;
    
    try {
      const res = await adminApi.getTrainers();
      setTrainers(res.data.trainers || []);
      setLoaded(prev => ({ ...prev, trainers: true }));
    } catch (err) {
      console.error(err);
    }
  };

  /* ============================
        LOAD MEMBERSHIP PLANS
     ============================ */
  const loadMembershipPlans = async (force = false) => {
    if (loaded.plans && !force) return;
    
    try {
      const res = await adminApi.getMembershipPlans();
      setMembershipPlans(res.data.membership_plans || res.data.plans || res.data || []);
      setLoaded(prev => ({ ...prev, plans: true }));
    } catch (err) {
      console.error(err);
      setMembershipPlans([]);
    }
  };

  useEffect(() => {
    // Load all data in parallel but with caching
    Promise.all([loadMembers(), loadTrainers(), loadMembershipPlans()]);
  }, []);

  /* ============================
        CREATE TRAINEE
     ============================ */
  const handleCreateMember = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      return await handleUpdateMember(e);
    }

    // Validation
    if (!form.name || !form.name.trim()) {
      toast.error("Full Name is required");
      return;
    }

    if (!form.email || !form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Phone validation if provided
    if (form.phone && !/^[\d\s\-\+\(\)]+$/.test(form.phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        password: form.password || null,
        trainer_id: form.trainer_id || null,
        membership_plan_id: form.membership_plan_id ? parseInt(form.membership_plan_id) : null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        address: form.address || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        health_conditions: form.health_conditions || null,
        fitness_goals: form.fitness_goals || null,
      };

      const res = await adminApi.createMember(payload);

      const pwd = res.data.generated_password || res.data.temp_password;
      toast.success(
        <div>
          <strong>Trainee created successfully!</strong>
          <br />
          <span className="text-sm">Password: <code className="bg-gray-100 px-1 rounded">{pwd}</code></span>
          {res.data.membership_created && <br />}
          {res.data.membership_created && <span className="text-sm text-green-600">✓ Membership activated</span>}
        </div>,
        { duration: 15000 }
      );

      // Reset form
      resetForm();
      setShowModal(false);
      loadMembers();
    } catch (err) {
      console.error("Create Member Error:", err);
      
      let msg = "Failed to create trainee";
      
      // Handle Pydantic validation errors
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        msg = err.response.data.detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
      } else if (typeof err.response?.data?.detail === "string") {
        msg = err.response.data.detail;
      } else if (err.message) {
        msg = err.message;
      }

      toast.error(msg);
    }
  };

  /* ============================
        DELETE / REMOVE TRAINEE
     ============================ */
  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Remove trainee ${member.name}? They will lose dashboard access.`)) return;

    try {
      await adminApi.deleteMember(member.id); // backend: soft delete user / disable
      toast.success("Trainee removed");
      loadMembers();
    } catch (err) {
      console.error("Delete Member Error:", err);
      
      let msg = "Failed to remove trainee";
      
      // Handle Pydantic validation errors
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        msg = err.response.data.detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
      } else if (typeof err.response?.data?.detail === "string") {
        msg = err.response.data.detail;
      } else if (err.message) {
        msg = err.message;
      }
      
      toast.error(msg);
    }
  };

  /* ============================
        RESET PASSWORD
     ============================ */
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setPasswordLoading(true);
      // Call the API with correct payload
      await adminApi.resetPassword(passwordResetTarget.id, newPassword);
      
      toast.success(
        <div>
          <p>Password reset for <strong>{passwordResetTarget.name}</strong></p>
          <p className="text-xs mt-1">New password: <code className="bg-white px-1 rounded">{newPassword}</code></p>
        </div>,
        { duration: 5000 }
      );
      
      setShowPasswordResetModal(false);
      setPasswordResetTarget(null);
      setNewPassword("");
      loadMembers(true); // Force reload
    } catch (err) {
      console.error("Reset Password Error:", err);
      let msg = "Failed to reset password";
      
      // Handle Pydantic validation errors (array of objects)
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        msg = err.response.data.detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
      } else if (typeof err.response?.data?.detail === "string") {
        msg = err.response.data.detail;
      } else if (err.message) {
        msg = err.message;
      }
      
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const openPasswordResetModal = (member) => {
    setPasswordResetTarget(member);
    setNewPassword("");
    setShowPasswordResetModal(true);
  };

  /* ============================
        EDIT TRAINEE
     ============================ */
  const handleEditMember = (member) => {
    setIsEditMode(true);
    setForm({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      password: "", // Don't show password in edit mode
      trainer_id: "", // Will be set later
      membership_plan_id: "",
      date_of_birth: member.date_of_birth || "",
      gender: member.gender || "",
      address: member.address || "",
      emergency_contact_name: member.emergency_contact_name || "",
      emergency_contact_phone: member.emergency_contact_phone || "",
      health_conditions: member.health_conditions || "",
      fitness_goals: member.fitness_goals || "",
    });
    setSelectedMember(member);
    setShowModal(true);
  };

  /* ============================
        UPDATE TRAINEE
     ============================ */
  const handleUpdateMember = async (e) => {
    e.preventDefault();
    
    if (!selectedMember) return;

    // Validation
    if (!form.name || !form.name.trim()) {
      toast.error("Full Name is required");
      return;
    }

    try {
      const payload = {
        name: form.name,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        address: form.address || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        health_conditions: form.health_conditions || null,
        fitness_goals: form.fitness_goals || null,
      };

      await adminApi.updateMember(selectedMember.id, payload);
      toast.success("Trainee updated successfully");
      setShowModal(false);
      setIsEditMode(false);
      resetForm();
      loadMembers();
    } catch (err) {
      console.error("Update Member Error:", err);
      
      let msg = "Failed to update trainee";
      
      // Handle Pydantic validation errors
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        msg = err.response.data.detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
      } else if (typeof err.response?.data?.detail === "string") {
        msg = err.response.data.detail;
      } else if (err.message) {
        msg = err.message;
      }
      
      toast.error(msg);
    }
  };

  /* ============================
        RESET FORM
     ============================ */
  const resetForm = () => {
    setForm({
      name: "", email: "", phone: "", password: "",
      trainer_id: "", membership_plan_id: "",
      date_of_birth: "", gender: "", address: "",
      emergency_contact_name: "", emergency_contact_phone: "",
      health_conditions: "", fitness_goals: "",
    });
    setSelectedMember(null);
    setIsEditMode(false);
  };

  /* ============================
        TOGGLE TRAINEE SELECTION
     ============================ */
  const toggleTraineeSelection = (memberId) => {
    const newSelected = new Set(selectedTrainees);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedTrainees(newSelected);
  };

  /* ============================
        SELECT ALL TRAINEES
     ============================ */
  const toggleSelectAll = () => {
    if (selectedTrainees.size === filtered.length) {
      setSelectedTrainees(new Set());
    } else {
      const allIds = new Set(filtered.map(m => m.id));
      setSelectedTrainees(allIds);
    }
  };

  /* ============================
        BULK DELETE TRAINEES
     ============================ */
  const handleBulkDelete = async () => {
    if (selectedTrainees.size === 0) {
      toast.error("Select trainees first");
      return;
    }

    if (!window.confirm(`Remove ${selectedTrainees.size} trainees? They will lose dashboard access.`)) return;

    try {
      let deleted = 0;
      let failed = 0;
      const failedNames = [];
      
      for (const id of selectedTrainees) {
        try {
          await adminApi.deleteMember(id);
          deleted++;
        } catch (err) {
          console.error(`Failed to delete trainee ${id}`, err);
          failed++;
          // Try to get trainee name from list
          const trainee = members.find(m => m.id === id);
          if (trainee) failedNames.push(trainee.name);
        }
      }
      
      if (deleted > 0) {
        toast.success(`Removed ${deleted} trainee(s)`);
      }
      
      if (failed > 0) {
        const msg = `Failed to remove ${failed} trainee(s): ${failedNames.join(", ")}`;
        toast.error(msg);
      }
      
      setSelectedTrainees(new Set());
      loadMembers();
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete some trainees");
    }
  };

  /* ============================
        DETAILS DRAWER
     ============================ */
  const openDetails = async (member) => {
    setSelectedMember(member);
    setDetailsOpen(true);
    setDetailsTab('profile');
    
    // Try to fetch detailed info, but fallback to list data if not available
    try {
      setDetailsLoading(true);
      const res = await adminApi.getTraineeDetails(member.id).catch(() => null);
      
      if (res?.data) {
        setDetails(res.data);
      } else {
        // Use data from the list view as fallback
        setDetails({
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          trainer_name: member.trainer_name,
          memberships: member.memberships || [],
          created_at: member.created_at
        });
      }
    } catch (err) {
      console.error('Error loading full details:', err);
      // Use fallback data from member object
      setDetails({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        trainer_name: member.trainer_name,
        memberships: member.memberships || [],
        created_at: member.created_at
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedMember(null);
    setDetails(null);
  };

  /* ============================
        CHANGE TRAINER
     ============================ */
  const handleChangeTrainer = async (trainerId) => {
    if (!selectedMember) return;

    try {
      await adminApi.updateTraineeTrainer(selectedMember.id, {
        trainer_id: trainerId || null,
      });
      toast.success("Trainer updated");

      // update UI
      if (details) {
        const trainerObj = trainers.find((t) => t.id === trainerId);
        setDetails({
          ...details,
          profile: {
            ...details.profile,
            trainer: trainerObj
              ? {
                  id: trainerObj.id,
                  name: trainerObj.user?.name,
                  email: trainerObj.user?.email,
                  phone: trainerObj.user?.phone,
                }
              : null,
          },
        });
      }

      // refresh main list to update trainer_name
      loadMembers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update trainer");
    }
  };

  /* ============================
        MEMBERSHIP ACTIONS
     ============================ */
  const extendMembership = async () => {
    if (!selectedMember) return;
    try {
      await adminApi.updateTraineeMembership(selectedMember.id, {
        action: "extend",
        extend_days: 30,
      });
      toast.success("Membership extended by 30 days");
      // reload details
      openDetails(selectedMember);
    } catch (err) {
      console.error(err);
      toast.error("Failed to extend membership");
    }
  };

  const cancelMembership = async () => {
    if (!selectedMember) return;
    if (!window.confirm("Cancel current membership?")) return;
    try {
      await adminApi.updateTraineeMembership(selectedMember.id, {
        action: "cancel",
      });
      toast.success("Membership cancelled");
      openDetails(selectedMember);
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel membership");
    }
  };

  /* ============================
        SEARCH & FILTER
     ============================ */
  const filterAndSortMembers = () => {
    let result = members.filter((m) =>
      (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply status filter
    if (filterStatus === "active") {
      result = result.filter(m => m.membership_type && m.trainer_name);
    } else if (filterStatus === "inactive") {
      result = result.filter(m => !m.membership_type || !m.trainer_name);
    } else if (filterStatus === "no-trainer") {
      result = result.filter(m => !m.trainer_name);
    } else if (filterStatus === "no-membership") {
      result = result.filter(m => !m.membership_type);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortBy] || "";
      let bVal = b[sortBy] || "";

      if (sortBy === "created_at") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return result;
  };

  const filtered = filterAndSortMembers();

  return (
    <div className="space-y-6">

      {/* HEADER + ADD BUTTON */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Trainee Management</h2>
          <p className="text-gray-600 dark:text-gray-300 text-base mt-2 font-medium">
            Add, remove trainees, manage memberships and trainer assignments.
          </p>
        </div>

        {/* Add Trainee Button */}
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Add New Trainee
        </button>
      </div>

      {/* ADD TRAINEE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-500 to-blue-600 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isEditMode ? `Edit Trainee: ${selectedMember?.name}` : 'Add New Trainee'}
                </h3>
                <p className="text-orange-100 text-sm">
                  {isEditMode ? 'Update trainee details' : 'Fill in trainee details'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateMember} className="p-6 space-y-6">
              {/* Section: Basic Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Basic Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1 font-medium">Full Name *</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 transition-all"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      required
                      maxLength="100"
                    />
                    {form.name && form.name.length > 0 && <span className="text-xs text-green-600 mt-1">✓</span>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1 font-medium">Email Address *</label>
                    <input
                      type="email"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 transition-all"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })}
                      placeholder="e.g. john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1 font-medium">Phone Number</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 transition-all"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      type="tel"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-200 mb-1 font-medium">
                      <Lock className="w-3 h-3" />
                      Password
                    </label>
                    {!isEditMode && (
                      <>
                        <input
                          type="password"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 transition-all"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Leave blank to auto-generate"
                          minLength="6"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave blank for auto-generated password</p>
                      </>
                    )}
                    {isEditMode && (
                      <p className="text-xs text-gray-500 italic">Password cannot be changed in edit mode. Use admin password reset if needed.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Personal Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Personal Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1 font-medium">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 transition-all"
                      value={form.date_of_birth}
                      onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1 font-medium">Gender</label>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 transition-all"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1 font-medium">Address</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 transition-all"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="e.g. City, State, Country"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Trainer & Plan */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Assignment & Membership
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1">Assign Trainer</label>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      value={form.trainer_id}
                      onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}
                    >
                      <option value="">Not assigned</option>
                      {trainers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.user?.name} ({t.specialization || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1">Membership Plan</label>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      value={form.membership_plan_id}
                      onChange={(e) => setForm({ ...form, membership_plan_id: e.target.value })}
                    >
                      <option value="">No plan (can select later)</option>
                      {membershipPlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || p.membership_type} - ₹{p.price} ({p.duration_days} days)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Emergency Contact */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4" /> Emergency Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1">Contact Name</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      value={form.emergency_contact_name}
                      onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                      placeholder="e.g. Parent/Spouse name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1">Contact Phone</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      value={form.emergency_contact_phone}
                      onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Health & Fitness */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Health & Fitness Goals
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1">Health Conditions / Allergies / Injuries</label>
                    <textarea
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      rows={2}
                      value={form.health_conditions}
                      onChange={(e) => setForm({ ...form, health_conditions: e.target.value })}
                      placeholder="e.g. Asthma, Knee injury, Diabetes..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-200 mb-1">Fitness Goals</label>
                    <textarea
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      rows={2}
                      value={form.fitness_goals}
                      onChange={(e) => setForm({ ...form, fitness_goals: e.target.value })}
                      placeholder="e.g. Weight loss, Muscle building, General fitness..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
                >
                  {isEditMode ? (
                    <>
                      <Edit className="w-4 h-4" />
                      Update Trainee
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Trainee
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLE TOOLBAR */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Top Toolbar */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 space-y-4">
          {/* Search and Filter Row */}
          <div className="flex gap-3 flex-col lg:flex-row justify-between items-start lg:items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 text-indigo-500 dark:text-indigo-400" />
              <input
                className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl pl-12 pr-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 transition-all font-medium placeholder-gray-400 dark:placeholder-slate-500"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Clear search"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            >
              <option value="all">📋 All Trainees</option>
              <option value="active">✓ Active (Trainer + Membership)</option>
              <option value="inactive">⊘ Inactive</option>
              <option value="no-trainer">👤 No Trainer</option>
              <option value="no-membership">💳 No Membership</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            >
              <option value="name">🔤 Sort: Name</option>
              <option value="email">✉️ Sort: Email</option>
              <option value="created_at">📅 Sort: Joined Date</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-gray-700 dark:text-gray-200 cursor-pointer"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
            </button>
          </div>

          {/* Bulk Actions Row */}
          {selectedTrainees.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
              <span className="text-sm font-bold text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 px-3 py-1.5 rounded-lg">
                {selectedTrainees.size} {selectedTrainees.size === 1 ? 'trainee' : 'trainees'} selected
              </span>
              <button
                onClick={() => setSelectedTrainees(new Set())}
                className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-bold hover:bg-blue-200 dark:hover:bg-blue-800 px-3 py-1 rounded transition-all"
              >
                ✕ Clear
              </button>
              <button
                onClick={handleBulkDelete}
                className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg text-sm font-bold transition-all border-0"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800 text-white sticky top-0">
              <tr>
                <th className="py-4 px-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTrainees.size > 0 && selectedTrainees.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-400 cursor-pointer w-5 h-5"
                  />
                </th>
                <th className="py-4 px-4 text-left font-bold text-white text-sm uppercase tracking-wider">Trainee</th>
                <th className="py-4 px-4 text-left font-bold text-white text-sm uppercase tracking-wider">Contact</th>
                <th className="py-4 px-4 text-left font-bold text-white text-sm uppercase tracking-wider">Status</th>
                <th className="py-4 px-4 text-left font-bold text-white text-sm uppercase tracking-wider">Trainer</th>
                <th className="py-4 px-4 text-left font-bold text-white text-sm uppercase tracking-wider">Membership</th>
                <th className="py-4 px-4 text-left font-bold text-white text-sm uppercase tracking-wider">Joined</th>
                <th className="py-4 px-4 text-center font-bold text-white text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 animate-pulse"></div>
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Loading trainees...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-1">No trainees found</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Try adjusting your search or add a new trainee</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const isActive = m.membership_type && m.trainer_name;
                  return (
                    <tr key={m.id} className="hover:bg-indigo-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200 border-b dark:border-gray-700 last:border-b-0">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedTrainees.has(m.id)}
                          onChange={() => toggleTraineeSelection(m.id)}
                          className="rounded border-gray-300 dark:border-gray-600 cursor-pointer w-5 h-5"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-lg font-bold shadow-md flex-shrink-0">
                            {(m.name || "T")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white text-base">{m.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{m.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-200 font-medium text-sm">
                          <PhoneIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          {m.phone || <span className="text-gray-400 dark:text-gray-500 italic font-normal">Not provided</span>}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          isActive
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          {isActive ? 'Active' : 'Incomplete'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {m.trainer_name ? (
                            <>
                              <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                              <span className="font-semibold text-gray-900 dark:text-gray-200 text-sm">{m.trainer_name}</span>
                            </>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic text-sm font-normal">Not assigned</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {m.membership_type ? (
                            <>
                              <Activity className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                              <span className="font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 px-2.5 py-1 rounded-lg text-sm">{m.membership_type}</span>
                            </>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic text-sm font-normal">No plan</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-sm">
                          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openDetails(m)}
                            className="p-2.5 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditMember(m)}
                            className="p-2.5 rounded-lg text-sky-600 dark:text-indigo-400 bg-sky-50 dark:bg-sky-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                            title="Edit Trainee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPasswordResetModal(m)}
                            className="p-2.5 rounded-lg text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                            title="Reset Password"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m)}
                            className="p-2.5 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                            title="Delete Trainee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Stats */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 flex flex-wrap gap-4 justify-between items-center">
            <div className="font-medium">
              Showing <span className="font-bold text-gray-900 dark:text-white">{filtered.length}</span> of <span className="font-bold text-gray-900 dark:text-white">{members.length}</span> trainees
            </div>
            <div className="flex gap-4 sm:gap-6 text-sm font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Active: <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {members.filter(m => m.membership_type && m.trainer_name).length}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                No Trainer: <span className="font-bold text-amber-600 dark:text-amber-400">
                  {members.filter(m => !m.trainer_name).length}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                No Membership: <span className="font-bold text-red-600 dark:text-red-400">
                  {members.filter(m => !m.membership_type).length}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DETAILS DRAWER */}
      <TraineeDetailsDrawer
        open={detailsOpen}
        onClose={closeDetails}
        loading={detailsLoading}
        member={selectedMember}
        details={details}
        activeTab={detailsTab}
        setActiveTab={setDetailsTab}
        trainers={trainers}
        onChangeTrainer={handleChangeTrainer}
        onExtendMembership={extendMembership}
        onCancelMembership={cancelMembership}
        showPasswordResetModal={showPasswordResetModal}
        setShowPasswordResetModal={setShowPasswordResetModal}
        passwordResetTarget={passwordResetTarget}
        setPasswordResetTarget={setPasswordResetTarget}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        passwordLoading={passwordLoading}
        handleResetPassword={handleResetPassword}
      />
    </div>
  );
};

/* =========================================
      TRAINEE DETAILS DRAWER COMPONENT
   ========================================= */
const TraineeDetailsDrawer = ({
  open,
  onClose,
  loading,
  member,
  details,
  activeTab,
  setActiveTab,
  trainers,
  onChangeTrainer,
  onExtendMembership,
  onCancelMembership,
  showPasswordResetModal,
  setShowPasswordResetModal,
  passwordResetTarget,
  setPasswordResetTarget,
  newPassword,
  setNewPassword,
  passwordLoading,
  handleResetPassword,
}) => {
  if (!open) return null;

  // Handle different data structures
  const memberInfo = member || {};
  const traineeData = details || memberInfo;
  const memberships = traineeData.memberships || [];
  const currentMembership = memberships.length > 0 ? memberships[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* drawer */}
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-transparent flex items-center justify-between bg-gradient-to-r from-indigo-500 to-blue-600 text-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-lg font-bold shadow-inner">
              {(memberInfo.name?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {memberInfo.name || 'Trainee'}
              </h3>
              <p className="text-sm text-white/80">
                {memberInfo.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 border-b border-gray-200 dark:border-gray-700 flex gap-1 overflow-x-auto sticky top-16 bg-white dark:bg-gray-800 z-10">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'health', label: 'Health Info', icon: Heart },
            { id: 'membership', label: 'Membership', icon: Calendar },
            { id: 'attendance', label: 'Attendance', icon: Users },
            { id: 'billing', label: 'Billing', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-lg border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-600 dark:text-indigo-400 bg-sky-50 dark:bg-sky-900/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {loading && (
            <p className="text-center text-gray-400 dark:text-gray-500 mt-10">Loading details...</p>
          )}

          {!loading && (
            <>
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard label="Name" value={memberInfo.name} />
                    <InfoCard label="Email" value={memberInfo.email} />
                    <InfoCard label="Phone" value={memberInfo.phone || '—'} />
                    <InfoCard label="Member Since" value={memberInfo.created_at ? new Date(memberInfo.created_at).toLocaleDateString() : '—'} />
                  </div>

                  {/* Personal Info */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoCard label="Date of Birth" value={memberInfo.date_of_birth ? new Date(memberInfo.date_of_birth).toLocaleDateString() : '—'} />
                      <InfoCard label="Gender" value={memberInfo.gender || '—'} />
                      <div className="col-span-2">
                        <InfoCard label="Address" value={memberInfo.address || '—'} />
                      </div>
                    </div>
                  </div>

                  {/* Trainer Assignment */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Assigned Trainer</h4>
                    <select
                      className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 transition-all"
                      value={memberInfo.trainer_name ? trainers.find(t => t.user?.name === memberInfo.trainer_name)?.id || '' : ''}
                      onChange={(e) => onChangeTrainer(e.target.value)}
                    >
                      <option value="">Not assigned</option>
                      {trainers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.user?.name} ({t.specialization || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'health' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      Health Conditions & Allergies
                    </h4>
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {memberInfo.health_conditions || 'No health conditions recorded'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      Fitness Goals
                    </h4>
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {memberInfo.fitness_goals || 'No fitness goals set'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Emergency Contact</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <InfoCard label="Contact Name" value={memberInfo.emergency_contact_name || '—'} />
                      <InfoCard label="Contact Phone" value={memberInfo.emergency_contact_phone || '—'} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'membership' && (
                <div className="space-y-5">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Memberships
                  </h4>
                  {currentMembership ? (
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-2">
                      <p className="font-bold text-emerald-800 dark:text-emerald-300 text-base">
                        {currentMembership.membership_type || 'Active Plan'}
                      </p>
                      <p className="text-emerald-700 dark:text-emerald-400 text-sm">
                        Status: <span className="font-semibold">{currentMembership.status || 'active'}</span>
                      </p>
                      {currentMembership.start_date && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">Start: {new Date(currentMembership.start_date).toLocaleDateString()}</p>
                      )}
                      {currentMembership.end_date && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">End: {new Date(currentMembership.end_date).toLocaleDateString()}</p>
                      )}
                      {currentMembership.price && (
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Price: ₹{currentMembership.price}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        ⚠️ No active membership. Assign a plan to activate.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={onExtendMembership}
                      className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold transition-colors"
                    >
                      ✓ Extend by 30 days
                    </button>
                    <button
                      onClick={onCancelMembership}
                      className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/60 font-semibold transition-colors"
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  {memberships.length > 1 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Previous Memberships</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {memberships.slice(1).map((m, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{m.membership_type}</p>
                            <p className="text-gray-600 dark:text-gray-400">{m.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Attendance data will be displayed here when available
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Billing information will be displayed here when available
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Password Reset Modal */}
        {showPasswordResetModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Set a new password for <span className="font-semibold text-gray-900 dark:text-white">{passwordResetTarget?.name}</span> ({passwordResetTarget?.email})
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setPasswordResetTarget(null);
                    setNewPassword("");
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={passwordLoading || !newPassword}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200/50 dark:border-gray-600/50">
    <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-medium tracking-wide">{label}</p>
    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{value || '—'}</p>
  </div>
);

const SummaryPill = ({ label, value }) => (
  <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 border border-gray-200/50 dark:border-gray-600/50">
    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{label}</p>
    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
  </div>
);

export default TraineeManagement;
