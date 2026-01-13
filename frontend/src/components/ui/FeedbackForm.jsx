
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const FeedbackForm = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [type, setType] = useState('feedback')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) {
      toast.error('Message is required')
      return
    }
    setLoading(true)
    try {
      const payload = {
        message: message.trim(),
        email: email || user?.email || null,
        type,
        user_id: user?.id || null
      }
      await api.post('/api/feedback/feedback', payload)
      toast.success('Thank you for your feedback! Our admin team has been notified.')
      setMessage('')
      if (!user) setEmail('')
      setType('feedback')
    } catch (err) {
      console.error('Feedback submission error:', err)
      toast.error(err.response?.data?.detail || 'Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (user?.role === 'TRAINEE') {
      navigate('/trainee')
    } else if (user?.role === 'TRAINER') {
      navigate('/trainer')
    } else if (user?.role === 'ADMIN') {
      navigate('/admin')
    } else {
      navigate('/')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 p-8 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col gap-6">
      {/* Back Button */}
      {user && (
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Back to Dashboard</span>
        </button>
      )}
      
      <h2 className="text-2xl font-bold text-center text-white mb-2">We Value Your Feedback</h2>
      <p className="text-center text-slate-400 mb-4">Let us know your thoughts, report a bug, or suggest a feature. Your feedback goes directly to our admin team.</p>
      
      {user && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 mb-2">
          <p className="text-sm text-indigo-300">
            <span className="font-semibold">Logged in as:</span> {user.name} ({user.role})
          </p>
        </div>
      )}

      <div>
        <label className="block mb-1 font-semibold text-slate-300">Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="feedback">Feedback</option>
          <option value="bug">Bug Report</option>
          <option value="suggestion">Suggestion</option>
        </select>
      </div>
      <div>
        <label className="block mb-1 font-semibold text-slate-300">Your Email <span className="text-slate-500 font-normal">(optional)</span></label>
        <input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder={user?.email || "you@example.com"}
          disabled={!!user?.email}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-500" 
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold text-slate-300">Message <span className="text-red-400">*</span></label>
        <textarea 
          value={message} 
          onChange={e => setMessage(e.target.value)} 
          required 
          minLength={5} 
          maxLength={1000} 
          placeholder="Describe your feedback, bug, or suggestion..." 
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical placeholder-slate-500" 
        />
        <p className="text-xs text-slate-500 mt-1">{message.length}/1000 characters</p>
      </div>
      <button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </span>
        ) : 'Submit Feedback'}
      </button>
    </form>
  )
}

export default FeedbackForm
