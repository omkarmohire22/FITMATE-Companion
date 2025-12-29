import { useEffect, useState, useMemo } from 'react'
import { adminApi } from '../../../utils/api'
import { motion } from 'framer-motion'
import {
  DollarSign,
  CreditCard,
  AlertCircle,
  Receipt,
  Download,
  FileText,
  Filter,
  XCircle,
  RefreshCw,
  Plus,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'

const BillingFinance = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [filterMode, setFilterMode] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [refundModal, setRefundModal] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  
  // Manual billing modal
  const [showBillModal, setShowBillModal] = useState(false)
  const [members, setMembers] = useState([])
  const [membershipPlans, setMembershipPlans] = useState([])
  const [billForm, setBillForm] = useState({
    trainee_id: '',
    membership_plan_id: '',
    amount: '',
    payment_mode: 'cash',
    transaction_id: '',
    notes: ''
  })

  // Load payments from backend
  const loadPayments = async (force = false) => {
    if (loaded && !force) return;
    
    setLoading(true)
    try {
      const res = await adminApi.getPayments({
        mode: filterMode !== 'all' ? filterMode : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: search || undefined,
      })
      setPayments(res.data.payments || res.data || [])
      setLoaded(true)
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout loading payments')
      } else {
        toast.error(err.message || 'Failed to load payments')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
    loadMembersAndPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load members and plans for billing
  const loadMembersAndPlans = async () => {
    try {
      const [membersRes, plansRes] = await Promise.all([
        adminApi.getMembers(),
        adminApi.getMembershipPlans()
      ])
      setMembers(membersRes.data.members || [])
      setMembershipPlans(plansRes.data.membership_plans || plansRes.data.plans || [])
    } catch (err) {
      console.error('Failed to load members/plans:', err)
    }
  }

  // Handle manual bill creation
  const handleCreateBill = async (e) => {
    e.preventDefault()
    
    if (!billForm.trainee_id) {
      toast.error('Please select a trainee')
      return
    }
    
    if (!billForm.amount || parseFloat(billForm.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    try {
      setLoading(true)
      
      const selectedMember = members.find(m => m.id === parseInt(billForm.trainee_id))
      const selectedPlan = membershipPlans.find(p => p.id === parseInt(billForm.membership_plan_id))
      
      // Create payment record
      const paymentData = {
        trainee_id: parseInt(billForm.trainee_id),
        amount: parseFloat(billForm.amount),
        payment_mode: billForm.payment_mode,
        transaction_id: billForm.transaction_id || `MAN-${Date.now()}`,
        status: 'completed',
        provider: selectedPlan ? selectedPlan.name : 'Manual Payment',
        notes: billForm.notes || 'Manual membership billing',
        receipt_number: `REC-${Date.now()}`
      }
      
      const res = await adminApi.createManualPayment(paymentData)
      
      toast.success(
        <div>
          <p>Bill created successfully!</p>
          <p className="text-xs mt-1">Receipt: {res.data.receipt_number}</p>
        </div>,
        { duration: 5000 }
      )
      
      // Reset form
      setBillForm({
        trainee_id: '',
        membership_plan_id: '',
        amount: '',
        payment_mode: 'cash',
        transaction_id: '',
        notes: ''
      })
      
      setShowBillModal(false)
      loadPayments(true)
      
      // Auto-download receipt
      if (res.data.payment_id) {
        setTimeout(() => handleDownloadReceipt({ id: res.data.payment_id, receipt_number: res.data.receipt_number }), 1000)
      }
      
    } catch (err) {
      console.error('Failed to create bill:', err)
      toast.error(err.response?.data?.detail || 'Failed to create bill')
    } finally {
      setLoading(false)
    }
  }
  
  // Update amount when plan is selected
  const handlePlanChange = (planId) => {
    setBillForm(prev => ({ ...prev, membership_plan_id: planId }))
    const plan = membershipPlans.find(p => p.id === parseInt(planId))
    if (plan) {
      setBillForm(prev => ({ ...prev, amount: plan.price.toString() }))
    }
  }

  // Totals
  const { totalRevenue, pendingAmount } = useMemo(() => {
    const completed = payments.filter((p) => p.status === 'completed')
    const pending = payments.filter((p) => p.status === 'pending')
    return {
      totalRevenue: completed.reduce((sum, p) => sum + (p.amount || 0), 0),
      pendingAmount: pending.reduce((sum, p) => sum + (p.amount || 0), 0),
    }
  }, [payments])

  // Filtered payments
const filteredPayments = useMemo(() => {
  // Normalize filter values
  const modeFilter = (filterMode || 'all').trim().toLowerCase();
  const statusFilter = (filterStatus || 'all').trim().toLowerCase();
  const searchLower = (search || '').trim().toLowerCase();

  return payments.filter((p) => {
    // Normalize payment fields
    const modeValue = (p.payment_mode || '').trim().toLowerCase();
    const statusValue = (p.status || '').trim().toLowerCase();
    const userStr = (p.trainee_email || p.user_email || '').toLowerCase();
    const receiptStr = (p.receipt_number || '').toLowerCase();
    const providerStr = (p.provider || '').toLowerCase();
    const notesStr = (p.notes || '').toLowerCase();

    // Mode filter
    const modeMatch =
      modeFilter === 'all' ||
      modeValue === modeFilter ||
      (modeFilter === 'upi' && modeValue.includes('upi')) ||
      (modeFilter === 'card' && modeValue.includes('card')) ||
      (modeFilter === 'cash' && modeValue.includes('cash'));

    // Status filter
    const statusMatch =
      statusFilter === 'all' ||
      statusValue === statusFilter;

    // Search filter (user, receipt, provider, notes)
    const searchMatch =
      !searchLower ||
      userStr.includes(searchLower) ||
      receiptStr.includes(searchLower) ||
      providerStr.includes(searchLower) ||
      notesStr.includes(searchLower);

    return modeMatch && statusMatch && searchMatch;
  });
}, [payments, filterMode, filterStatus, search]);

  const handleResetFilters = () => {
    setFilterMode('all')
    setFilterStatus('all')
    setSearch('')
  }

  // Refund
  const handleRefund = async () => {
    if (!refundModal) return
    const amt = Number(refundAmount)
    if (!amt || amt <= 0 || amt > (refundModal.amount || 0)) {
      toast.error('Enter a valid refund amount (≤ original amount)')
      return
    }
    setLoading(true)
    try {
      await adminApi.refundPayment({
        payment_id: refundModal.id,
        refund_amount: amt,
        refund_reason: refundReason || 'No reason specified',
      })
      toast.success('Refund processed successfully')
      setRefundModal(null)
      setRefundAmount('')
      setRefundReason('')
      loadPayments()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to process refund')
    } finally {
      setLoading(false)
    }
  }

  // Export
  const handleExport = async (format) => {
    setLoading(true)
    try {
      const res = await adminApi.exportFinance({ format })
      const blob = new Blob([res.data], {
        type:
          format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        format === 'pdf' ? 'finance-report.pdf' : 'finance-report.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Failed to export report')
    } finally {
      setLoading(false)
    }
  }

  // Download receipt
  const handleDownloadReceipt = async (payment) => {
    if (payment.receipt_pdf_url) {
      window.open(payment.receipt_pdf_url, '_blank')
      return
    }
    setLoading(true)
    try {
      const res = await adminApi.downloadReceipt(payment.id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${payment.receipt_number || 'receipt'}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Failed to download receipt')
    } finally {
      setLoading(false)
    }
  }

  return (

    <div className="space-y-10 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Billing & Finance</h2>
          <p className="text-gray-300 text-lg mt-2 font-medium">
            Track payments, revenue, refunds & financial health (₹ Rupees)
          </p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setShowBillModal(true)}
            className="px-6 py-2 rounded-2xl bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 text-lg font-semibold shadow-xl"
            disabled={loading}
          >
            <Plus className="w-6 h-6" />
            Create Bill
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-6 py-2 rounded-2xl bg-blue-700 text-white hover:bg-blue-800 flex items-center gap-2 text-lg font-semibold shadow-xl"
            disabled={loading}
          >
            <FileText className="w-6 h-6" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-6 py-2 rounded-2xl bg-green-700 text-white hover:bg-green-800 flex items-center gap-2 text-lg font-semibold shadow-xl"
            disabled={loading}
          >
            <Download className="w-6 h-6" />
            Export Excel
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mt-2">
        <SummaryCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          subtitle="Completed payments"
          icon={<DollarSign className="w-8 h-8 text-emerald-700" />}
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending Amount"
          value={`₹${pendingAmount.toLocaleString()}`}
          subtitle="Awaiting completion"
          icon={<AlertCircle className="w-8 h-8 text-amber-700" />}
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Total Transactions"
          value={payments.length}
          subtitle="All payment records"
          icon={<CreditCard className="w-8 h-8 text-blue-700" />}
          bgClass="bg-blue-50"
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 shadow-lg flex flex-wrap gap-6 items-center justify-between mt-2 border border-gray-200"
      >
        <div className="flex items-center gap-4">
          <Filter className="w-6 h-6 text-gray-700" />
          <p className="font-bold text-gray-800 text-lg">Filters</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            className="px-5 py-2 rounded-xl border-2 border-gray-300 text-gray-800 text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
          >
            <option value="all">All Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
          <select
            className="px-5 py-2 rounded-xl border-2 border-gray-300 text-gray-800 text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="text"
            placeholder="Search by user or receipt..."
            className="px-5 py-2 rounded-xl border-2 border-gray-300 text-lg w-72 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 text-lg px-5 py-2 rounded-xl border-2 border-gray-300 bg-gray-100 hover:bg-gray-200 font-semibold"
            disabled={loading}
          >
            <RefreshCw className="w-5 h-5" />
            Reset
          </button>
        </div>
      </motion.div>

      {/* Payments Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl overflow-x-auto w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h3>
          {loading && (
            <span className="text-base text-gray-500 animate-pulse flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading...
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th>Receipt</Th>
                <Th>User / Email</Th>
                <Th>Amount (₹)</Th>
                <Th>Mode</Th>
                <Th>Status</Th>
                <Th>Date & Time</Th>
                <Th>Refund Info</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-orange-50/40 transition-all">
                  <Td>
                    <span className="font-semibold text-gray-900">{pay.receipt_number || '—'}</span>
                    {pay.provider && (
                      <p className="text-xs text-gray-500 mt-0.5">{pay.provider}</p>
                    )}
                  </Td>
                  <Td>
                    <span className="font-medium text-gray-900">{pay.trainee_email || pay.user_email || '—'}</span>
                    {pay.notes && (
                      <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate" title={pay.notes}>{pay.notes}</p>
                    )}
                  </Td>
                  <Td>
                    <span className="font-bold text-gray-900 text-base">₹{(pay.amount || 0).toLocaleString()}</span>
                  </Td>
                  <Td>
                    <span className="px-3 py-1.5 bg-gray-100 rounded-xl text-sm font-semibold capitalize text-gray-700">
                      {pay.payment_mode || '—'}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={pay.status} />
                  </Td>
                  <Td>
                    <span className="text-sm font-medium text-gray-900">
                      {pay.created_at ? new Date(pay.created_at).toLocaleDateString() : '—'}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {pay.created_at ? new Date(pay.created_at).toLocaleTimeString() : ''}
                    </p>
                  </Td>
                  <Td>
                    {pay.is_refund ? (
                      <div className="text-xs">
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded-lg font-semibold mb-1">Refunded</span>
                        <p className="text-red-600 font-medium">₹{pay.refund_amount || 0}</p>
                        {pay.refund_reason && (
                          <p className="text-gray-600 text-xs mt-0.5 truncate max-w-xs" title={pay.refund_reason}>{pay.refund_reason}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <button
                        className="p-2.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        onClick={() => handleDownloadReceipt(pay)}
                        title="Download receipt"
                        aria-label="Download receipt"
                      >
                        <Receipt className="w-5 h-5" />
                      </button>
                      {pay.status === 'completed' && !pay.is_refund && (
                        <button
                          className="p-2.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          onClick={() => setRefundModal(pay)}
                          title="Refund payment"
                          aria-label="Refund payment"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {filteredPayments.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 px-4 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Receipt className="w-16 h-16 text-gray-300 mb-3" />
                      <p className="text-gray-700 font-semibold text-lg mb-1">No payment records found</p>
                      <p className="text-gray-500 text-sm">Try adjusting your filters or create a new bill</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Refund Modal */}
      {refundModal && (
        <RefundModal
          payment={refundModal}
          refundAmount={refundAmount}
          refundReason={refundReason}
          setRefundAmount={setRefundAmount}
          setRefundReason={setRefundReason}
          onClose={() => setRefundModal(null)}
          onConfirm={handleRefund}
        />
      )}
      
      {/* Manual Bill Creation Modal */}
      {showBillModal && (
        <ManualBillModal
          billForm={billForm}
          setBillForm={setBillForm}
          members={members}
          membershipPlans={membershipPlans}
          loading={loading}
          onClose={() => {
            setShowBillModal(false)
            setBillForm({
              trainee_id: '',
              membership_plan_id: '',
              amount: '',
              payment_mode: 'cash',
              transaction_id: '',
              notes: ''
            })
          }}
          onSubmit={handleCreateBill}
          handlePlanChange={handlePlanChange}
        />
      )}
    </div>
  )
}

/* ------------ SMALL COMPONENTS ------------ */

const SummaryCard = ({ title, value, subtitle, icon, bgClass }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-xl p-5 flex items-center justify-between"
  >
    <div>
      <p className="text-xs text-gray-500 uppercase">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className={`w-11 h-11 rounded-xl ${bgClass} flex items-center justify-center`}>
      {icon}
    </div>
  </motion.div>
)

const Th = ({ children }) => (
  <th className="py-4 px-4 text-left font-bold text-sm text-gray-800 uppercase tracking-wide">
    {children}
  </th>
)

const Td = ({ children }) => (
  <td className="py-4 px-4 text-gray-800">{children}</td>
)

const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase()
  const cls =
    s === 'completed'
      ? 'bg-emerald-100 text-emerald-700'
      : s === 'pending'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700'

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {status || 'unknown'}
    </span>
  )
}

const RefundModal = ({
  payment,
  refundAmount,
  refundReason,
  setRefundAmount,
  setRefundReason,
  onClose,
  onConfirm,
}) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Refund Payment</h3>
      <p className="text-sm text-gray-600">
        You are refunding payment{' '}
        <span className="font-semibold">#{payment.id}</span> —{' '}
        <span className="font-semibold">
          ₹{(payment.amount || 0).toLocaleString()}
        </span>
      </p>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-700">
          Refund Amount (₹)
        </label>
        <input
          type="number"
          min={0}
          max={payment.amount || undefined}
          className="w-full px-3 py-2 border rounded-xl text-sm"
          value={refundAmount}
          onChange={(e) => setRefundAmount(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-700">
          Reason (optional)
        </label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border rounded-xl text-sm resize-none"
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700"
        >
          Confirm Refund
        </button>
      </div>
    </div>
  </div>
)

const ManualBillModal = ({
  billForm,
  setBillForm,
  members,
  membershipPlans,
  loading,
  onClose,
  onSubmit,
  handlePlanChange
}) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8 space-y-6 my-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
          <Receipt className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Create Manual Bill</h3>
          <p className="text-sm text-gray-500">Create membership payment and generate receipt</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Trainee Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Select Trainee *
            </label>
            <select
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={billForm.trainee_id}
              onChange={(e) => setBillForm({...billForm, trainee_id: e.target.value})}
            >
              <option value="">-- Select Trainee --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          {/* Membership Plan */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Membership Plan
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={billForm.membership_plan_id}
              onChange={(e) => handlePlanChange(e.target.value)}
            >
              <option value="">-- Select Plan (Optional) --</option>
              {membershipPlans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - ₹{p.price}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={billForm.amount}
              onChange={(e) => setBillForm({...billForm, amount: e.target.value})}
              placeholder="Enter amount"
            />
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Payment Mode *
            </label>
            <select
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={billForm.payment_mode}
              onChange={(e) => setBillForm({...billForm, payment_mode: e.target.value})}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        {/* Transaction ID */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Transaction ID (Optional)
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={billForm.transaction_id}
            onChange={(e) => setBillForm({...billForm, transaction_id: e.target.value})}
            placeholder="Enter transaction ID (auto-generated if empty)"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={billForm.notes}
            onChange={(e) => setBillForm({...billForm, notes: e.target.value})}
            placeholder="Add any additional notes..."
          />
        </div>

        {/* Summary */}
        {billForm.amount && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-purple-900 mb-2">Bill Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">Amount:</span>
                <span className="font-bold text-purple-900">₹{parseFloat(billForm.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Payment Mode:</span>
                <span className="font-semibold text-purple-900 capitalize">{billForm.payment_mode}</span>
              </div>
              {billForm.membership_plan_id && (
                <div className="flex justify-between">
                  <span className="text-purple-700">Plan:</span>
                  <span className="font-semibold text-purple-900">
                    {membershipPlans.find(p => p.id === parseInt(billForm.membership_plan_id))?.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                Create Bill & Download Receipt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)

export default BillingFinance
