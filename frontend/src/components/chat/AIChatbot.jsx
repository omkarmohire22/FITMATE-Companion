import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, RefreshCw, Trash2, Copy, Check, Wifi, WifiOff, AlertCircle, Dumbbell, Apple, Brain, Target, Zap, Clock, MessageSquare, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { chatApi } from '../../utils/api'
import toast from 'react-hot-toast'

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! 👋 I'm your personal AI fitness coach powered by advanced AI. I'm here to help you achieve your fitness goals with personalized advice on:\n\n💪 **Workout Plans** - Custom routines for your goals\n🥗 **Nutrition** - Diet tips and meal planning\n📈 **Progress Tracking** - Analyze your journey\n🔥 **Motivation** - Stay inspired and consistent\n\nHow can I assist you today?",
      timestamp: new Date()
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [aiStatus, setAiStatus] = useState('connected') // 'connected', 'not_configured', 'error'
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)

  // Auto Scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle scroll to show/hide scroll button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100)
    }
  }

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
        responseContent = "⚙️ **AI Configuration Pending**\n\nThe AI system is awaiting configuration by the administrator. In the meantime, here are some evidence-based fitness tips:\n\n• **Hydration**: Drink 500ml of water 2 hours before training\n• **Warm-up**: 5-10 minutes of dynamic stretching prevents injury\n• **Progressive Overload**: Increase weight/reps by 2.5-5% weekly\n• **Recovery**: Muscles grow during rest - aim for 7-9 hours of sleep"
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
      let fallbackResponse = "I'm experiencing connectivity issues. Please try again in a moment."
      
      const lowerInput = userInput.toLowerCase()
      if (lowerInput.includes('workout') || lowerInput.includes('exercise') || lowerInput.includes('training')) {
        fallbackResponse = "**💪 Quick Workout Guidance**\n\nWhile I reconnect, here's proven advice:\n\n• **Beginners**: Start with 3 full-body sessions/week\n• **Intermediate**: Try a 4-day upper/lower split\n• **Advanced**: Consider push/pull/legs 6 days/week\n\n**Pro Tip**: Focus on compound movements (squats, deadlifts, bench press, rows) for maximum efficiency!"
      } else if (lowerInput.includes('nutrition') || lowerInput.includes('diet') || lowerInput.includes('food') || lowerInput.includes('eat') || lowerInput.includes('protein')) {
        fallbackResponse = "**🥗 Nutrition Essentials**\n\nHere's science-backed nutrition advice:\n\n• **Protein**: 1.6-2.2g per kg bodyweight for muscle building\n• **Carbs**: 3-5g per kg for energy (more if highly active)\n• **Fats**: 0.5-1g per kg for hormone health\n• **Timing**: Eat protein within 2 hours post-workout\n\n**Pro Tip**: Prioritize whole foods over supplements!"
      } else if (lowerInput.includes('weight') || lowerInput.includes('lose') || lowerInput.includes('fat') || lowerInput.includes('cut')) {
        fallbackResponse = "**⚖️ Weight Management Tips**\n\n• **Fat Loss**: 300-500 calorie deficit for sustainable results\n• **Muscle Gain**: 200-300 calorie surplus (lean bulk)\n• **Maintenance**: Track for 2 weeks to find your TDEE\n\n**Key Insight**: Weight loss is 80% nutrition. You can't out-train a bad diet!"
      } else if (lowerInput.includes('gain') || lowerInput.includes('muscle') || lowerInput.includes('bulk') || lowerInput.includes('mass')) {
        fallbackResponse = "**💪 Muscle Building Fundamentals**\n\n• **Training**: 10-20 sets per muscle group per week\n• **Protein**: 1.6-2.2g per kg bodyweight daily\n• **Progressive Overload**: Add weight/reps each week\n• **Rest**: 48-72 hours between training same muscle\n\n**Pro Tip**: Sleep is when muscles grow - prioritize 7-9 hours!"
      } else if (lowerInput.includes('motivat') || lowerInput.includes('tired') || lowerInput.includes('lazy') || lowerInput.includes('give up')) {
        fallbackResponse = "**🔥 Motivation Boost**\n\n*\"The only bad workout is the one that didn't happen.\"*\n\n• Start with just 10 minutes - momentum builds\n• Track your wins, no matter how small\n• Remember your 'why' - visualize your goals\n• Progress isn't linear - trust the process\n\n**You've got this!** Every rep counts. 💪"
      } else if (lowerInput.includes('form') || lowerInput.includes('technique') || lowerInput.includes('injury') || lowerInput.includes('pain')) {
        fallbackResponse = "**🎯 Form & Safety Tips**\n\n• **Rule #1**: Never sacrifice form for weight\n• **Warm-up**: 5-10 min before every session\n• **Control**: 2 sec up, 3 sec down (eccentric)\n• **Pain**: Sharp pain = STOP immediately\n\n**Pro Tip**: Record yourself to check form, or ask a trainer for feedback!"
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
        content: "Hello! 👋 I'm your personal AI fitness coach powered by advanced AI. I'm here to help you achieve your fitness goals with personalized advice on:\n\n💪 **Workout Plans** - Custom routines for your goals\n🥗 **Nutrition** - Diet tips and meal planning\n📈 **Progress Tracking** - Analyze your journey\n🔥 **Motivation** - Stay inspired and consistent\n\nHow can I assist you today?",
        timestamp: new Date()
      },
    ])
    setConversationId(null)
    toast.success('Conversation cleared')
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

  // Enhanced markdown-like formatting for AI responses
  const formatMessage = (content) => {
    if (!content) return content
    
    // Convert **bold** to styled spans
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Convert *italic* to styled spans
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>')
    // Convert bullet points with better styling
    formatted = formatted.replace(/^• /gm, '<span class="text-blue-400 mr-1">•</span>')
    // Convert numbered lists
    formatted = formatted.replace(/^(\d+)\. /gm, '<span class="text-purple-400 font-bold mr-1">$1.</span>')
    
    return formatted
  }

  const getStatusIndicator = () => {
    switch (aiStatus) {
      case 'connected':
        return { color: 'bg-emerald-500', text: 'Online', icon: Wifi, textColor: 'text-emerald-400' }
      case 'not_configured':
        return { color: 'bg-amber-500', text: 'Limited Mode', icon: AlertCircle, textColor: 'text-amber-400' }
      case 'error':
        return { color: 'bg-red-500', text: 'Reconnecting...', icon: WifiOff, textColor: 'text-red-400' }
      default:
        return { color: 'bg-slate-500', text: 'Connecting...', icon: Wifi, textColor: 'text-slate-400' }
    }
  }

  const statusInfo = getStatusIndicator()
  const StatusIcon = statusInfo.icon

  // Categorized suggested questions with icons
  const questionCategories = [
    {
      category: 'Workouts',
      icon: Dumbbell,
      color: 'from-blue-500 to-cyan-500',
      questions: [
        "Create a 4-week muscle building program",
        "Best exercises for a stronger core",
        "How to structure a HIIT workout"
      ]
    },
    {
      category: 'Nutrition',
      icon: Apple,
      color: 'from-green-500 to-emerald-500',
      questions: [
        "Calculate my daily calorie needs",
        "Pre and post workout meal ideas",
        "How to meal prep for the week"
      ]
    },
    {
      category: 'Goals',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      questions: [
        "How to lose fat while keeping muscle",
        "Tips for breaking through a plateau",
        "Setting realistic fitness goals"
      ]
    }
  ]

  const quickPrompts = [
    { text: "Workout plan", icon: Dumbbell, color: "from-blue-600 to-blue-500" },
    { text: "Nutrition tips", icon: Apple, color: "from-green-600 to-green-500" },
    { text: "Motivation", icon: Zap, color: "from-amber-600 to-amber-500" },
    { text: "Form check", icon: Target, color: "from-purple-600 to-purple-500" },
  ]

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col backdrop-blur-xl h-[calc(100vh-200px)] min-h-[600px] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20"
            >
              <Bot className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`absolute -bottom-1 -right-1 w-5 h-5 ${statusInfo.color} rounded-full border-3 border-slate-900 flex items-center justify-center`}
            >
              <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
            </motion.div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Fitness Coach
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </motion.div>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.textColor}`} />
              <span className={`text-sm font-medium ${statusInfo.textColor}`}>
                {statusInfo.text}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-500">Powered by Advanced AI</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              checkAIStatus()
              toast.success('Status refreshed')
            }}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700/50"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearChat}
            className="p-2.5 bg-slate-800/80 hover:bg-red-500/20 rounded-xl transition-colors border border-slate-700/50 group"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* AI Status Warning */}
      <AnimatePresence>
        {aiStatus === 'not_configured' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-5 mt-4"
          >
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-amber-300 font-semibold text-sm">Limited AI Mode</p>
                  <p className="text-amber-400/70 text-xs mt-1">
                    AI is providing basic fitness guidance. Full personalization available once configured.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className={`w-10 h-10 bg-gradient-to-br ${message.isError ? 'from-amber-500/20 to-orange-500/20 border-amber-500/30' : 'from-blue-500/20 to-purple-500/20 border-blue-500/30'} rounded-xl flex items-center justify-center backdrop-blur-sm border flex-shrink-0 shadow-lg`}
                >
                  <Bot className={`w-5 h-5 ${message.isError ? 'text-amber-400' : 'text-blue-400'}`} />
                </motion.div>
              )}

              <div className="flex flex-col gap-1.5 max-w-[75%]">
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  className={`group relative rounded-2xl px-5 py-4 text-sm shadow-xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white ml-auto'
                      : message.isError 
                        ? 'bg-gradient-to-br from-slate-800/90 to-slate-800/70 text-slate-100 border border-amber-500/30 backdrop-blur-sm'
                        : 'bg-gradient-to-br from-slate-800/90 to-slate-800/70 text-slate-100 border border-slate-700/50 backdrop-blur-sm'
                  }`}
                >
                  <div 
                    className="leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                  />
                  
                  {/* Copy Button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => copyMessage(message.content, index)}
                    className="absolute -top-2 -right-2 p-2 bg-slate-700 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-slate-600 border border-slate-600"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </motion.button>
                </motion.div>
                
                <div className="flex items-center gap-2 px-2">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span className="text-xs text-slate-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>

              {message.role === 'user' && (
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                >
                  <User className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-blue-500/30">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-slate-700/50 rounded-2xl px-5 py-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Brain className="w-4 h-4 text-purple-400" />
                  </motion.div>
                  <span className="text-sm text-slate-300">Analyzing your request</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                        animate={{
                          y: [0, -4, 0],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.12
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggested Questions (only show when chat is fresh) */}
        {messages.length === 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 pt-4"
          >
            <div className="flex items-center gap-2 px-1">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-400 font-medium">Popular Topics</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {questionCategories.map((cat, catIndex) => (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + catIndex * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 px-1">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                      <cat.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{cat.category}</span>
                  </div>
                  {cat.questions.map((question, qIndex) => (
                    <motion.button
                      key={qIndex}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setInput(question)
                        inputRef.current?.focus()
                      }}
                      className="w-full text-left text-xs p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600 rounded-xl text-slate-300 transition-all"
                    >
                      {question}
                    </motion.button>
                  ))}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-32 right-8 p-3 bg-blue-600 hover:bg-blue-500 rounded-full shadow-xl z-10"
          >
            <ChevronDown className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-5 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-slate-900/30">
        {/* Quick Prompts */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((prompt, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setInput(prompt.text)
                inputRef.current?.focus()
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${prompt.color} rounded-lg text-xs font-medium text-white whitespace-nowrap shadow-lg`}
            >
              <prompt.icon className="w-3.5 h-3.5" />
              {prompt.text}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about fitness, nutrition, or workouts..."
              className="w-full px-5 py-4 bg-slate-800/80 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-slate-500 backdrop-blur-sm transition-all pr-16"
              disabled={loading}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
              <span className={input.length > 450 ? 'text-amber-400' : ''}>{input.length}</span>/500
            </div>
          </div>

          <motion.button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-xl shadow-purple-500/20 hover:shadow-purple-500/30 transition-all disabled:hover:scale-100 min-w-[100px] justify-center"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <RefreshCw className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </motion.button>
        </div>
        
        <p className="text-xs text-slate-500 mt-3 text-center flex items-center justify-center gap-1.5">
          <AlertCircle className="w-3 h-3" />
          AI can make mistakes. Verify important fitness information with professionals.
        </p>
      </div>
    </div>
  )
}

export default AIChatbot