import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, RefreshCw, Trash2, Copy, Check, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { chatApi } from '../../utils/api'
import toast from 'react-hot-toast'

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I'm your AI fitness assistant powered by GPT-4. I can help you with workouts, nutrition, progress tracking, and motivation. What would you like to know?",
      timestamp: new Date()
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [aiStatus, setAiStatus] = useState('connected') // 'connected', 'not_configured', 'error'
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto Scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check AI status on mount
  useEffect(() => {
    checkAIStatus()
  }, [])

  const checkAIStatus = async () => {
    try {
      const res = await chatApi.getStatus()
      const data = res.data || res
      if (!data.openai_configured) {
        setAiStatus('not_configured')
      }
    } catch (error) {
      console.error('Failed to check AI status:', error)
    }
  }

  // Real API call to backend
  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = input.trim()
    setInput('')
    setLoading(true)

    try {
      // Call the real AI backend
      const res = await chatApi.query({
        message: userInput,
        conversation_id: conversationId
      })
      
      const data = res.data || res

      // Update conversation ID if returned
      if (data.conversation_id && data.conversation_id !== 'new') {
        setConversationId(data.conversation_id)
      }

      // Handle different response statuses
      let responseContent = data.response || "I couldn't generate a response. Please try again."
      
      if (data.status === 'not_configured') {
        setAiStatus('not_configured')
        responseContent = "⚠️ AI is not configured yet. The administrator needs to set up the OpenAI API key. In the meantime, here are some general tips:\n\n• Stay hydrated during workouts\n• Warm up before exercise\n• Get 7-9 hours of sleep\n• Track your progress daily"
      } else if (data.status === 'error') {
        setAiStatus('error')
      } else {
        setAiStatus('connected')
      }

      const assistantMessage = {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setAiStatus('error')
      
      // Provide helpful fallback responses based on keywords
      let fallbackResponse = "Sorry, I'm having trouble connecting right now. Please try again later."
      
      const lowerInput = userInput.toLowerCase()
      if (lowerInput.includes('workout') || lowerInput.includes('exercise')) {
        fallbackResponse = "I'm having connection issues, but here's a quick tip: Try a balanced routine with cardio and strength training 3-4 times per week. Start with compound exercises like squats, deadlifts, and bench press for maximum efficiency! 💪"
      } else if (lowerInput.includes('nutrition') || lowerInput.includes('diet') || lowerInput.includes('food') || lowerInput.includes('eat')) {
        fallbackResponse = "I'm having connection issues, but here's a quick tip: Focus on whole foods - lean proteins, complex carbs, and healthy fats. Aim for 1.6-2.2g of protein per kg of body weight if you're building muscle! 🥗"
      } else if (lowerInput.includes('weight') || lowerInput.includes('lose') || lowerInput.includes('gain')) {
        fallbackResponse = "I'm having connection issues, but here's a quick tip: Weight management is 80% nutrition, 20% exercise. Track your calories and aim for a 300-500 calorie deficit for sustainable fat loss, or surplus for muscle gain! ⚖️"
      } else if (lowerInput.includes('motivat') || lowerInput.includes('tired') || lowerInput.includes('lazy')) {
        fallbackResponse = "I'm having connection issues, but remember: Every workout counts! Start small - even 10 minutes is better than nothing. You've got this! 🔥"
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackResponse,
          timestamp: new Date(),
          isError: true
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hey! I'm your AI fitness assistant powered by GPT-4. I can help you with workouts, nutrition, progress tracking, and motivation. What would you like to know?",
        timestamp: new Date()
      },
    ])
    setConversationId(null)
    toast.success('Chat cleared')
  }

  const copyMessage = (content, index) => {
    navigator.clipboard.writeText(content)
    setCopiedIndex(index)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Simple markdown-like formatting for AI responses
  const formatMessage = (content) => {
    if (!content) return content
    
    // Convert **bold** to styled spans
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert bullet points
    formatted = formatted.replace(/^• /gm, '• ')
    // Convert numbered lists
    formatted = formatted.replace(/^(\d+)\. /gm, '$1. ')
    
    return formatted
  }

  const getStatusIndicator = () => {
    switch (aiStatus) {
      case 'connected':
        return { color: 'bg-green-500', text: 'AI Online', icon: Wifi }
      case 'not_configured':
        return { color: 'bg-yellow-500', text: 'Limited Mode', icon: AlertCircle }
      case 'error':
        return { color: 'bg-red-500', text: 'Offline', icon: WifiOff }
      default:
        return { color: 'bg-gray-500', text: 'Unknown', icon: Wifi }
    }
  }

  const statusInfo = getStatusIndicator()
  const StatusIcon = statusInfo.icon

  const suggestedQuestions = [
    "Create a workout plan for muscle gain",
    "What should I eat before a workout?",
    "How can I improve my form?",
    "Give me motivation tips",
    "How much protein do I need?",
    "Best exercises for weight loss"
  ]

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 p-6 h-[700px] flex flex-col backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div className={`absolute -top-1 -right-1 w-4 h-4 ${statusInfo.color} rounded-full border-2 border-slate-900 ${aiStatus === 'connected' ? 'animate-pulse' : ''}`}></div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Fitness Assistant
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </h2>
            <div className="flex items-center gap-2">
              <StatusIcon className="w-3 h-3 text-slate-400" />
              <p className="text-sm text-slate-400">
                {statusInfo.text} • Powered by GPT-4
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={clearChat}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors group"
          title="Clear chat"
        >
          <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
        </button>
      </div>

      {/* AI Status Warning */}
      {aiStatus === 'not_configured' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
        >
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>AI is in limited mode. Basic fitness tips are available.</span>
          </div>
        </motion.div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className={`w-9 h-9 bg-gradient-to-br ${message.isError ? 'from-red-500/20 to-orange-500/20 border-red-500/20' : 'from-blue-500/20 to-purple-500/20 border-blue-500/20'} rounded-xl flex items-center justify-center backdrop-blur-sm border flex-shrink-0`}>
                  <Bot className={`w-5 h-5 ${message.isError ? 'text-orange-400' : 'text-blue-400'}`} />
                </div>
              )}

              <div className="flex flex-col gap-1 max-w-[80%]">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className={`group relative rounded-2xl px-4 py-3 text-sm shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                      : message.isError 
                        ? 'bg-slate-800/80 text-slate-100 border border-orange-500/30 backdrop-blur-sm'
                        : 'bg-slate-800/80 text-slate-100 border border-slate-700/50 backdrop-blur-sm'
                  }`}
                >
                  <div 
                    className="leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                  />
                  
                  {/* Copy Button */}
                  <button
                    onClick={() => copyMessage(message.content, index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-slate-600"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-300" />
                    )}
                  </button>
                </motion.div>
                
                <span className="text-xs text-slate-500 px-2">
                  {formatTime(message.timestamp)}
                </span>
              </div>

              {message.role === 'user' && (
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-purple-500/20 flex-shrink-0">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-blue-500/20">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl px-5 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Thinking</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                      animate={{
                        y: [0, -6, 0],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggested Questions (only show when chat is fresh) */}
        {messages.length === 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 pt-4"
          >
            <p className="text-xs text-slate-400 px-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Try asking:
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {suggestedQuestions.map((question, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(51, 65, 85, 0.7)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setInput(question)
                    inputRef.current?.focus()
                  }}
                  className="text-left text-xs p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl text-slate-300 transition-all hover:border-blue-500/30"
                >
                  {question}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about workouts, nutrition, or progress..."
              className="w-full px-5 py-4 bg-slate-800/80 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-slate-500 backdrop-blur-sm transition-all"
              disabled={loading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {input.length}/500
            </div>
          </div>

          <motion.button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow disabled:hover:scale-100"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">Send</span>
          </motion.button>
        </div>
        
        <p className="text-xs text-slate-500 mt-2 text-center">
          AI can make mistakes. Verify important fitness information.
        </p>
      </div>
    </div>
  )
}

export default AIChatbot