
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'

const FeedbackForm = () => {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
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
      await axios.post('/api/feedback/feedback', { message, email, type })
      toast.success('Thank you for your feedback!')
      setMessage('')
      setEmail('')
      setType('feedback')
    } catch (err) {
      toast.error('Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">We Value Your Feedback</h2>
      <p className="text-center text-gray-500 mb-4">Let us know your thoughts, report a bug, or suggest a feature. Your feedback goes directly to our admin team.</p>
      <div>
        <label className="block mb-1 font-semibold text-gray-700">Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
          <option value="feedback">Feedback</option>
          <option value="bug">Bug Report</option>
          <option value="suggestion">Suggestion</option>
        </select>
      </div>
      <div>
        <label className="block mb-1 font-semibold text-gray-700">Your Email <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
      </div>
      <div>
        <label className="block mb-1 font-semibold text-gray-700">Message <span className="text-red-500">*</span></label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} required minLength={5} maxLength={1000} placeholder="Describe your feedback, bug, or suggestion..." className="w-full border border-gray-300 rounded-lg px-4 py-2 min-h-[120px] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-vertical" />
      </div>
      <button type="submit" disabled={loading} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
        {loading ? 'Sending...' : 'Submit'}
      </button>
    </form>
  )
}

export default FeedbackForm
