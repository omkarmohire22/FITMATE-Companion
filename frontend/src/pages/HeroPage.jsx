import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20,
        y: (e.clientY / window.innerHeight) * 20
      });
    };

    const handleKeyDown = (e) => {
      // Press Escape to scroll to top
      if (e.key === 'Escape') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{
            x: mousePosition.x,
            y: mousePosition.y
          }}
          transition={{ type: "spring", stiffness: 50 }}
          className="absolute w-96 h-96 bg-green-500/10 rounded-full blur-3xl top-20 -left-48 animate-pulse"
        ></motion.div>
        <motion.div 
          animate={{
            x: -mousePosition.x,
            y: -mousePosition.y
          }}
          transition={{ type: "spring", stiffness: 50 }}
          className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl bottom-20 -right-48 animate-pulse delay-1000"
        ></motion.div>
        <div className="absolute w-64 h-64 bg-purple-500/10 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <nav className="flex justify-between items-center py-4 sm:py-6 px-2">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center space-x-2 sm:space-x-3"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/50">
              <span className="text-white font-bold text-lg sm:text-xl md:text-2xl">V</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg sm:text-xl md:text-2xl tracking-wider">VIAN-ELI</h1>
              <p className="text-green-400 text-[10px] sm:text-xs md:text-sm font-semibold">GYMATION</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex gap-2 sm:gap-3 md:gap-4"
          >
            <button
              onClick={() => navigate('/login')}
              aria-label="Login to your account"
              className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2.5 text-white border border-green-400/50 rounded-full hover:bg-green-400/10 transition-all duration-300 text-xs sm:text-sm md:text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-95"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/login')}
              aria-label="Get started with FitMate"
              className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 text-xs sm:text-sm md:text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-95"
            >
              Get Started
            </button>
          </motion.div>
        </nav>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[calc(100vh-180px)] sm:min-h-[calc(100vh-200px)] py-8 sm:py-12 lg:py-0 gap-8 sm:gap-12 lg:gap-8 px-2">
          
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 text-center lg:text-left space-y-4 sm:space-y-6 lg:space-y-8 w-full"
          >
            <div className="space-y-3 sm:space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="inline-block"
              >
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500/20 text-green-400 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold border border-green-400/30">
                  🏆 BE STRONG, LIVE FIT
                </span>
              </motion.div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight px-2">
                Transform Your
                <span className="block bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent mt-1 sm:mt-2">
                  Body & Mind
                </span>
              </h1>
              
              <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0 px-4 sm:px-2">
                Experience the future of fitness at Vian Gymation. Where cutting-edge AI meets personalized training for unmatched results.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start px-4 sm:px-0">
              <button
                onClick={() => navigate('/login')}
                aria-label="Start your fitness journey"
                className="group px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold text-base sm:text-lg hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-95"
              >
                Start Your Journey
                <span className="ml-2 group-hover:ml-3 transition-all duration-300" aria-hidden="true">→</span>
              </button>
              
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Learn more about our features"
                className="px-6 py-3 sm:px-8 sm:py-4 bg-white/5 backdrop-blur-sm text-white rounded-full font-semibold text-base sm:text-lg border border-white/10 hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-95"
              >
                Learn More
              </button>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 justify-center lg:justify-start pt-6 sm:pt-8 px-4 sm:px-0"
            >
              <div className="text-center lg:text-left">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">500+</h3>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">Active Members</p>
              </div>
              <div className="text-center lg:text-left border-x border-gray-700 px-2">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">15+</h3>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">Expert Trainers</p>
              </div>
              <div className="text-center lg:text-left">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">24/7</h3>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">AI Support</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Logo Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex-1 flex items-center justify-center w-full max-w-md lg:max-w-none"
          >
            <div className="relative w-full">
              {/* Glowing Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              
              {/* Pulsing Energy Rings */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute inset-0 rounded-full border-4 border-green-400"
              />
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5
                }}
                className="absolute inset-0 rounded-full border-4 border-emerald-400"
              />
              
              {/* Main Logo Container */}
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl">
                <div className="space-y-6">
                  {/* Vian-Eli Gymation Logo */}
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative"
                  >
                    {/* Try to load actual logo, fallback to styled version */}
                    <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 mx-auto">
                      <img 
                        src="/assets/vian-logo.png" 
                        alt="Vian Gymation"
                        className="w-full h-full object-contain rounded-full"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full bg-black rounded-full hidden items-center justify-center shadow-lg shadow-green-500/20 border-2 sm:border-4 border-green-400/30">
                        <div className="text-center p-3 sm:p-6">
                          <div className="text-4xl sm:text-6xl md:text-7xl mb-1 sm:mb-2">💪</div>
                          <div className="text-green-400 font-bold text-base sm:text-xl md:text-2xl tracking-wider">VIAN-ELI</div>
                          <div className="text-white text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">GYMATION</div>
                          <div className="text-gray-400 text-[10px] sm:text-xs mt-1 sm:mt-2 font-semibold">BE STRONG, LIVE FIT</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* FitMate Logo */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center"
                  >
                    <div className="relative inline-block">
                      <img 
                        src="/assets/fitmate-logo.png" 
                        alt="FitMate"
                        className="h-12 sm:h-16 md:h-20 lg:h-24 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden bg-gradient-to-r from-gray-800 to-gray-900 px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/10">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="text-2xl sm:text-4xl">🏋️</div>
                          <div>
                            <div className="text-white font-bold text-lg sm:text-2xl tracking-wider">FitMate</div>
                            <div className="text-green-400 text-[10px] sm:text-xs font-semibold">Powered by AI</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50 text-xl sm:text-3xl"
              >
                🎯
              </motion.div>
              
              <motion.div
                animate={{ 
                  y: [0, 15, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50 text-xl sm:text-3xl"
              >
                ⚡
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.section
          id="features"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="py-12 sm:py-16 md:py-20 border-t border-white/10 px-2"
          aria-label="Features and Benefits"
        >
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-4">
              Why Choose <span className="text-green-400">Vian Gymation?</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
              Experience the perfect blend of technology and fitness expertise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                icon: "🤖",
                title: "AI-Powered Tracking",
                description: "Real-time form correction and rep counting with advanced computer vision"
              },
              {
                icon: "📊",
                title: "Personalized Plans",
                description: "Custom workout and nutrition plans tailored to your goals"
              },
              {
                icon: "👥",
                title: "Expert Trainers",
                description: "Certified professionals guiding you every step of the way"
              },
              {
                icon: "📱",
                title: "Smart Dashboard",
                description: "Track your progress with intuitive analytics and insights"
              },
              {
                icon: "🥗",
                title: "Nutrition Guidance",
                description: "AI-powered meal planning and calorie tracking"
              },
              {
                icon: "🏆",
                title: "Achievement System",
                description: "Earn badges and stay motivated with gamification"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-white/10 hover:border-green-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-2 active:scale-95"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm sm:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Location Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="py-12 sm:py-16 md:py-20 border-t border-white/10 px-2"
        >
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border border-white/10 max-w-4xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-block p-3 sm:p-4 bg-green-500/20 rounded-full mb-3 sm:mb-4">
                <span className="text-3xl sm:text-4xl">📍</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Visit Us</h2>
              <p className="text-gray-400 text-sm sm:text-base md:text-lg">Your fitness journey starts here</p>
            </div>
            
            <div className="space-y-3 sm:space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-gray-300">
                <span className="text-xl sm:text-2xl">🏢</span>
                <p className="text-base sm:text-lg md:text-xl font-semibold">Vian Gymation</p>
              </div>
              <div className="flex items-start justify-center gap-2 sm:gap-3 text-gray-400">
                <span className="text-lg sm:text-xl mt-1">📮</span>
                <p className="text-sm sm:text-base md:text-lg max-w-md">
                  2nd Floor, Phatak Capital,<br />
                  Dapoli - Harnai Road,<br />
                  Dapoli, Maharashtra 415712
                </p>
              </div>
              <div className="pt-3 sm:pt-4">
                <a
                  href="https://maps.google.com/?q=2nd+Floor,+Phatak+Capital,+Dapoli+-+Harnai+Road,+Dapoli,+Maharashtra+415712"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get directions to Vian Gymation on Google Maps"
                  className="inline-block px-6 py-2.5 sm:px-8 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold text-sm sm:text-base hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-95"
                >
                  Get Directions →
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="py-12 sm:py-16 md:py-20 text-center px-2"
        >
          <div className="relative bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-xl p-8 sm:p-12 md:p-16 rounded-2xl sm:rounded-3xl border border-green-400/30 max-w-4xl mx-auto overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
            
            <div className="relative z-10 space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white px-4">
                Ready to Transform?
              </h2>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-4">
                Join hundreds of members who are already seeing incredible results with FitMate
              </p>
              <button
                onClick={() => navigate('/login')}
                aria-label="Get started with Vian Gymation today"
                className="inline-block px-8 py-3 sm:px-10 sm:py-4 bg-white text-gray-900 rounded-full font-bold text-base sm:text-lg hover:shadow-2xl hover:shadow-white/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-95"
              >
                Get Started Now →
              </button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="py-6 sm:py-8 border-t border-white/10 text-center text-gray-400 px-4">
          <p className="text-xs sm:text-sm md:text-base">
            &copy; 2025 Vian Gymation. All rights reserved. | Powered by FitMate AI
          </p>
        </footer>
      </div>
    </div>
  );
};

export default HeroPage;
