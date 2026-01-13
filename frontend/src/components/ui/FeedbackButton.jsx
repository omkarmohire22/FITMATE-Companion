import React from 'react'
import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const FeedbackButton = () => (
  <Link
    to="/feedback"
    className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold shadow transition-all"
    style={{ margin: '16px 0' }}
  >
    <MessageCircle className="w-5 h-5" />
    Feedback / Report Bug
  </Link>
)

export default FeedbackButton
