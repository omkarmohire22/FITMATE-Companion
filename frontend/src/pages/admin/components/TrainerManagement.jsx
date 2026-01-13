import { useEffect, useState } from 'react';
import { adminApi } from '../../../utils/api';
import { motion } from 'framer-motion';
import {
  UserPlus, Award, MoreVertical, Edit, Trash2, Eye, Search, Filter, Users, DollarSign, Calendar, X, Plus, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const TrainerManagement = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false); // Track if data has been loaded
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal state for adding trainer
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [trainerForm, setTrainerForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    experience_years: '',
    certifications: '',
    salary_model: 'fixed',
    base_salary: '',
    commission_per_session: '',
    bio: '',
  });
  const [selectedTrainerForEdit, setSelectedTrainerForEdit] = useState(null);

  // Password reset state
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetTarget, setPasswordResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load trainers
  const loadTrainers = async (force = false) => {
    // Skip if already loaded and not forcing refresh
    if (loaded && !force) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await adminApi.getTrainers();
      const trainersData = res.data.trainers || [];
      
      // Debug: Log trainer data structure
      if (trainersData.length > 0) {
        console.log('Sample trainer data:', {
          id: trainersData[0].id,
          name: trainersData[0].user?.name,
          email: trainersData[0].user?.email
        });
      }
      
      setTrainers(trainersData);
      setLoaded(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout. Server is slow. Try again.');
      } else {
        toast.error(err.message || 'Failed to load trainers');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  // Create trainer
  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    if (!trainerForm.name || !trainerForm.email) {
      toast.error('Name and email are required');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: trainerForm.name,
        email: trainerForm.email,
        phone: trainerForm.phone || null,
        specialization: trainerForm.specialization || null,
        experience_years: trainerForm.experience_years ? parseInt(trainerForm.experience_years) : 0,
        certifications: trainerForm.certifications || null,
        salary_model: trainerForm.salary_model || 'fixed',
        base_salary: trainerForm.base_salary ? parseFloat(trainerForm.base_salary) : 0,
        commission_per_session: trainerForm.commission_per_session ? parseFloat(trainerForm.commission_per_session) : 0,
        bio: trainerForm.bio || null,
      };
      const res = await adminApi.createTrainer(payload);
      toast.success(`Trainer created! Temp password: ${res.data.login_password}`);
      setTrainerForm({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        experience_years: '',
        certifications: '',
        salary_model: 'fixed',
        base_salary: '',
        commission_per_session: '',
        bio: '',
      });
      setShowAddModal(false);
      loadTrainers();
    } catch (err) {
      console.error(err);
      let msg = 'Failed to create trainer';
      
      // Handle Pydantic validation errors
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        msg = err.response.data.detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
      } else if (typeof err.response?.data?.detail === "string") {
        msg = err.response.data.detail;
      } else if (err.message) {
        msg = err.message;
      }
      
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Open details drawer
  const openDetails = async (trainer) => {
    setSelectedTrainer(trainer);
    setDetailsOpen(true);
    setDetails(null);
    try {
      setActionLoading(true);
      const res = await adminApi.getTrainerDetails(trainer.id);
      setDetails(res.data);
    } catch (err) {
      toast.error('Failed to load trainer details');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit trainer (name, email, specialization, etc.)
  const handleEditTrainer = (trainer) => {
    setIsEditMode(true);
    setSelectedTrainerForEdit(trainer);
    // Extract salary config if present (for edit)
    const salary = trainer.salary_config || trainer.salary || {};
    setTrainerForm({
      name: trainer.user?.name || '',
      email: trainer.user?.email || '',
      phone: trainer.user?.phone || '',
      specialization: trainer.specialization || '',
      experience_years: trainer.experience_years || '',
      certifications: trainer.certifications || '',
      salary_model: salary.salary_model || 'fixed',
      base_salary: salary.base_salary || '',
      commission_per_session: salary.commission_per_session || '',
      bio: trainer.bio || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateTrainer = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      // Only send allowed fields for update, and only if not empty/null/undefined
      const allowedFields = [
        'name', 'email', 'phone', 'specialization', 'experience_years', 'certifications', 'bio', 'salary_model', 'base_salary', 'commission_per_session'
      ];
      const payload = {};
      for (const key of allowedFields) {
        let value = trainerForm[key];
        if (key === 'experience_years') value = value ? parseInt(value, 10) : undefined;
        if (key === 'base_salary') value = value ? parseFloat(value) : undefined;
        if (key === 'commission_per_session') value = value ? parseFloat(value) : undefined;
        if (value !== '' && value !== undefined && value !== null) {
          payload[key] = value;
        }
      }
      console.log('Trainer update payload:', payload); // For debugging
      await adminApi.updateTrainer(selectedTrainerForEdit.id, payload);
      toast.success('Trainer updated successfully');
      setShowEditModal(false);
      setSelectedTrainerForEdit(null);
      setIsEditMode(false);
      loadTrainers();
    } catch (err) {
      console.error("Update Trainer Error:", err);
      let msg = 'Failed to update trainer';
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        msg = err.response.data.detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
      } else if (typeof err.response?.data?.detail === "string") {
        msg = err.response.data.detail;
      } else if (err.message) {
        msg = err.message;
      }
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Deactivate trainer
  const handleDeactivateTrainer = async (trainerId) => {
    // Validate trainer ID
    if (!trainerId) {
      toast.error('Invalid trainer ID');
      return;
    }

    // Enhanced confirmation dialog
    const trainer = trainers.find(t => t.id === trainerId);
    const trainerName = trainer?.user?.name || 'this trainer';
    
    if (!window.confirm(
      `⚠️ WARNING: Delete ${trainerName}?\n\n` +
      `This will permanently delete:\n` +
      `• Trainer profile and account\n` +
      `• All salary and revenue records\n` +
      `• All schedules and attendance\n` +
      `• All messages and notifications\n\n` +
      `Assigned trainees will be unassigned.\n\n` +
      `This action CANNOT be undone!`
    )) {
      return;
    }

    try {
      setActionLoading(true);
      
      // Log the ID being sent for debugging
      console.log('Deleting trainer with ID:', trainerId);
      
      const response = await adminApi.deleteTrainer(trainerId);
      
      toast.success(`${trainerName} deleted successfully`);
      
      // Force refresh the trainers list
      await loadTrainers(true);
      
    } catch (err) {
      console.error('Delete trainer error:', err);
      
      // Better error messages
      if (err.response?.status === 401) {
        toast.error('Unauthorized. Please login again.');
      } else if (err.response?.status === 404) {
        toast.error('Trainer not found');
      } else if (err.response?.status === 400) {
        toast.error('Invalid trainer ID format');
      } else if (err.response?.data?.detail) {
        toast.error(`Error: ${err.response.data.detail}`);
      } else {
        toast.error('Failed to delete trainer. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setPasswordLoading(true);
      // Use user.id (integer) instead of trainer id (UUID)
      const userId = passwordResetTarget.user?.id || passwordResetTarget.id;
      const res = await adminApi.resetPassword(userId, newPassword);
      toast.success(`Password reset for ${passwordResetTarget.user?.name}`);
      setShowPasswordResetModal(false);
      setPasswordResetTarget(null);
      setNewPassword("");
      loadTrainers();
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

  const openPasswordResetModal = (trainer) => {
    setPasswordResetTarget(trainer);
    setNewPassword("");
    setShowPasswordResetModal(true);
  };

  // Filter trainers
  const filteredTrainers = trainers.filter((t) => {
    const name = t.user?.name?.toLowerCase() || '';
    const email = t.user?.email?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header + Create Form */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Trainer Management</h2>
          <p className="text-slate-300 text-base mt-2 font-medium">
            Add trainers, view details, manage payouts, attendance, salary, and assignments.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Trainer
        </button>
      </div>

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add New Trainer</h2>
                <p className="text-sm text-slate-500">Fill in all trainer details</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTrainer} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.name}
                    onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                    placeholder="e.g. Rahul Patil"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                    placeholder="e.g. rahul@fitmate.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.phone}
                    onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.specialization}
                    onChange={(e) => setTrainerForm({ ...trainerForm, specialization: e.target.value })}
                    placeholder="e.g. Weight Training, Yoga, CrossFit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.experience_years}
                    onChange={(e) => setTrainerForm({ ...trainerForm, experience_years: e.target.value })}
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Certifications</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.certifications}
                    onChange={(e) => setTrainerForm({ ...trainerForm, certifications: e.target.value })}
                    placeholder="e.g. ACE, NASM, ISSA"
                  />
                </div>
              </div>

              {/* Salary Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Salary Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Salary Model</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={trainerForm.salary_model}
                      onChange={(e) => setTrainerForm({ ...trainerForm, salary_model: e.target.value })}
                    >
                      <option value="fixed">Fixed Salary</option>
                      <option value="per_session">Per Session</option>
                      <option value="hybrid">Hybrid (Fixed + Per Session)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={trainerForm.base_salary}
                      onChange={(e) => setTrainerForm({ ...trainerForm, base_salary: e.target.value })}
                      placeholder="e.g. 25000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Per Session Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={trainerForm.commission_per_session}
                      onChange={(e) => setTrainerForm({ ...trainerForm, commission_per_session: e.target.value })}
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio / About</label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={trainerForm.bio}
                  onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
                  placeholder="Brief description about the trainer..."
                  rows={3}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Trainer
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Trainer Modal */}
      {showEditModal && selectedTrainerForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {setShowEditModal(false); setSelectedTrainerForEdit(null);}} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Edit Trainer</h2>
                <p className="text-sm text-slate-500">Update trainer details</p>
              </div>
              <button onClick={() => {setShowEditModal(false); setSelectedTrainerForEdit(null);}} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateTrainer} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.name}
                    onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                    placeholder="e.g. Rahul Patil"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                    placeholder="e.g. rahul@fitmate.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.phone}
                    onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.specialization}
                    onChange={(e) => setTrainerForm({ ...trainerForm, specialization: e.target.value })}
                    placeholder="e.g. Weight Training, Yoga, CrossFit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.experience_years}
                    onChange={(e) => setTrainerForm({ ...trainerForm, experience_years: e.target.value })}
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Certifications</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={trainerForm.certifications}
                    onChange={(e) => setTrainerForm({ ...trainerForm, certifications: e.target.value })}
                    placeholder="e.g. ACE, NASM, ISSA"
                  />
                </div>
              </div>

              {/* Salary Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Salary Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Salary Model</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={trainerForm.salary_model}
                      onChange={(e) => setTrainerForm({ ...trainerForm, salary_model: e.target.value })}
                    >
                      <option value="fixed">Fixed Salary</option>
                      <option value="per_session">Per Session</option>
                      <option value="hybrid">Hybrid (Fixed + Per Session)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={trainerForm.base_salary}
                      onChange={(e) => setTrainerForm({ ...trainerForm, base_salary: e.target.value })}
                      placeholder="e.g. 25000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Per Session Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={trainerForm.commission_per_session}
                      onChange={(e) => setTrainerForm({ ...trainerForm, commission_per_session: e.target.value })}
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio / About</label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={trainerForm.bio}
                  onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
                  placeholder="Brief description about the trainer..."
                  rows={3}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {setShowEditModal(false); setSelectedTrainerForEdit(null);}}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      Update Trainer
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Search trainers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Add more filters if needed */}
      </div>

      {/* Trainer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTrainers.map((t, index) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-200/50 overflow-hidden"
          >
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-white to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Status Badge */}
            <div className="absolute top-4 right-4 z-10">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm ${
                t.status === 'active'
                  ? 'bg-emerald-500/90 text-white border border-emerald-400/50'
                  : t.status === 'inactive'
                  ? 'bg-red-500/90 text-white border border-red-400/50'
                  : 'bg-slate-500/90 text-white border border-slate-400/50'
              }`}>
                {t.status || 'active'}
              </span>
            </div>

            <div className="relative p-6 flex flex-col h-full">
              {/* Header with Avatar */}
              <div className="flex items-start gap-4 mb-5">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center text-white shadow-xl ring-4 ring-emerald-100 group-hover:ring-emerald-200 transition-all duration-300">
                    <Award className="w-10 h-10" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs font-bold text-white">★</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors mb-1 truncate">
                    {t.user?.name || 'Trainer'}
                  </h3>
                  <p className="text-sm text-slate-500 truncate mb-2">{t.user?.email}</p>
                  
                  {/* Specialization Tag */}
                  {t.specialization && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1.5 rounded-full border border-indigo-200/50 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                      {t.specialization}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Grid with Icons */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="group/stat bg-gradient-to-br from-blue-50 to-blue-100/70 rounded-xl p-4 border border-blue-200/50 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Award className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">Experience</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 mb-0.5">{t.experience_years || 0}</p>
                  <p className="text-xs text-slate-500 font-medium">Years</p>
                </div>
                <div className="group/stat bg-gradient-to-br from-purple-50 to-purple-100/70 rounded-xl p-4 border border-purple-200/50 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">Trainees</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-700 mb-0.5">{t.assigned_trainees || 0}</p>
                  <p className="text-xs text-slate-500 font-medium">Assigned</p>
                </div>
              </div>

              {/* Compensation Section */}
              {(t.base_salary || t.commission_per_session) && (
                <div className="mb-5 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-slate-700 font-bold uppercase tracking-wide">Compensation</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {t.base_salary && (
                      <div className="flex-1 min-w-[120px] bg-white px-3 py-2.5 rounded-lg border border-green-200/50 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs text-slate-500 font-medium mb-1">Base Salary</p>
                        <p className="text-lg font-bold text-green-700">₹{t.base_salary.toLocaleString()}</p>
                      </div>
                    )}
                    {t.commission_per_session && (
                      <div className="flex-1 min-w-[120px] bg-white px-3 py-2.5 rounded-lg border border-cyan-200/50 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs text-slate-500 font-medium mb-1">Per Session</p>
                        <p className="text-lg font-bold text-cyan-700">₹{t.commission_per_session.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Joined Date */}
              <div className="mb-5 flex items-center gap-2 px-3 py-2 bg-slate-50/50 rounded-lg border border-slate-200/50">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600 font-medium">
                  Joined {t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/50 hover:border-blue-300 transition-all font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="View Details"
                  onClick={() => openDetails(t)}
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200/50 hover:border-sky-300 transition-all font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit Trainer"
                  onClick={() => handleEditTrainer(t)}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200/50 hover:border-purple-300 transition-all font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reset Password"
                  onClick={() => openPasswordResetModal(t)}
                >
                  <Lock className="w-4 h-4" />
                  Password
                </button>
                <button
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/50 hover:border-red-300 transition-all font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete Trainer"
                  onClick={() => handleDeactivateTrainer(t.id)}
                >
                  {actionLoading ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredTrainers.length === 0 && !loading && (
          <div className="col-span-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-12 text-center border border-blue-100">
            <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="font-semibold text-slate-700 text-lg mb-2">No Trainers Found</p>
            <p className="text-slate-500 text-sm mb-6">Start managing your gym by adding trainers</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Add First Trainer
            </button>
          </div>
        )}
      </div>

      {/* Trainer Details Drawer */}
      {detailsOpen && (
        <TrainerDetailsDrawer
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          loading={actionLoading}
          trainer={selectedTrainer}
          details={details}
          showPasswordResetModal={showPasswordResetModal}
          setShowPasswordResetModal={setShowPasswordResetModal}
          passwordResetTarget={passwordResetTarget}
          setPasswordResetTarget={setPasswordResetTarget}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          passwordLoading={passwordLoading}
          handleResetPassword={handleResetPassword}
        />
      )}
    </div>
  );
}

/* =========================================
      TRAINER DETAILS DRAWER COMPONENT
   ========================================= */
const TrainerDetailsDrawer = ({ 
  open, 
  onClose, 
  loading, 
  trainer, 
  details,
  showPasswordResetModal,
  setShowPasswordResetModal,
  passwordResetTarget,
  setPasswordResetTarget,
  newPassword,
  setNewPassword,
  passwordLoading,
  handleResetPassword
}) => {
  if (!open) return null;

  const profile = details?.trainer || {};
  const trainees = details?.trainees || [];
  const salary = details?.salary_config || {};
  const attendance = details?.attendance_list || [];
  const ptSessions = details?.pt_sessions || [];
  const schedule = details?.schedule_list || [];
  const payouts = details?.payouts || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* drawer */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Trainer Details</h2>
            <p className="text-xs text-slate-500">{profile.name} ({profile.email})</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
              onClick={() => {
                setPasswordResetTarget(trainer);
                setShowPasswordResetModal(true);
              }}
              title="Reset Password"
            >
              <Lock className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-semibold text-slate-700">Specialization</div>
              <div className="text-sm text-slate-500">{profile.specialization || '—'}</div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">Experience</div>
              <div className="text-sm text-slate-500">{profile.experience_years || 0} yrs</div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">Certifications</div>
              <div className="text-sm text-slate-500">{profile.certifications || '—'}</div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">Status</div>
              <div className="text-sm text-slate-500">{profile.is_active ? 'Active' : 'Inactive'}</div>
            </div>
          </div>

          {/* Salary Config */}
          <div className="bg-sky-50 rounded-lg p-4">
            <div className="font-semibold text-orange-700 mb-1">Salary Model</div>
            <div className="text-sm text-slate-700">{salary.model || '—'}</div>
            <div className="font-semibold text-orange-700 mt-2">Base Salary</div>
            <div className="text-sm text-slate-700">₹{salary.base_salary || 0}</div>
          </div>

          {/* Assigned Trainees */}
          <div>
            <div className="font-semibold text-slate-700 mb-2">Assigned Trainees</div>
            <div className="space-y-2">
              {trainees.length === 0 ? (
                <div className="text-slate-400 text-sm">No trainees assigned</div>
              ) : (
                trainees.map((t) => (
                  <div key={t.id} className="bg-slate-50 rounded-lg p-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.email}</div>
                    </div>
                    <div className="text-xs text-slate-400">{t.membership_status}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Attendance */}
          <div>
            <div className="font-semibold text-slate-700 mb-2">Attendance (This Month)</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-left">Check In</th>
                    <th className="px-2 py-1 text-left">Check Out</th>
                    <th className="px-2 py-1 text-left">Status</th>
                    <th className="px-2 py-1 text-left">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-slate-400 py-2">No attendance records</td></tr>
                  ) : (
                    attendance.map((a, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1">{a.date?.slice(0, 10)}</td>
                        <td className="px-2 py-1">{a.check_in?.slice(11, 16) || '—'}</td>
                        <td className="px-2 py-1">{a.check_out?.slice(11, 16) || '—'}</td>
                        <td className="px-2 py-1">{a.status}</td>
                        <td className="px-2 py-1">{a.hours_worked || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payouts */}
          <div>
            <div className="font-semibold text-slate-700 mb-2">Payouts</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left">Amount</th>
                    <th className="px-2 py-1 text-left">Notes</th>
                    <th className="px-2 py-1 text-left">Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-slate-400 py-2">No payouts</td></tr>
                  ) : (
                    payouts.map((p, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1">₹{p.amount}</td>
                        <td className="px-2 py-1">{p.notes || '—'}</td>
                        <td className="px-2 py-1">{p.paid_at?.slice(0, 10) || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PT Sessions */}
          <div>
            <div className="font-semibold text-slate-700 mb-2">Recent PT Sessions</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-left">Trainee</th>
                    <th className="px-2 py-1 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {ptSessions.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-slate-400 py-2">No PT sessions</td></tr>
                  ) : (
                    ptSessions.map((s, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1">{s.session_date?.slice(0, 10)}</td>
                        <td className="px-2 py-1">{s.trainee_name || '—'}</td>
                        <td className="px-2 py-1">{s.report_type || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div>
            <div className="font-semibold text-slate-700 mb-2">Weekly Schedule</div>
            <div className="grid grid-cols-2 gap-2">
              {schedule.length === 0 ? (
                <div className="text-slate-400 text-sm">No schedule set</div>
              ) : (
                schedule.map((s) => (
                  <div key={s.id} className="bg-slate-50 rounded-lg p-2">
                    <div className="font-medium text-gray-800">{s.day_name}</div>
                    <div className="text-xs text-slate-500">{s.start_time} - {s.end_time}</div>
                    <div className="text-xs text-slate-400">{s.is_available ? 'Available' : 'Not Available'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Set a new password for <span className="font-semibold">{passwordResetTarget?.user?.name}</span> ({passwordResetTarget?.user?.email})
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={passwordLoading || !newPassword}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerManagement;
