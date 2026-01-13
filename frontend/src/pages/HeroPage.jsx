import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Award, Users, Dumbbell, Target, Clock, Salad, Instagram } from 'lucide-react';

const HeroPage = () => {
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

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: mousePosition.x, y: mousePosition.y }}
          transition={{ type: "spring", stiffness: 50 }}
          className="absolute w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-3xl top-0 -left-64"
        />
        <motion.div 
          animate={{ x: -mousePosition.x, y: -mousePosition.y }}
          transition={{ type: "spring", stiffness: 50 }}
          className="absolute w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl bottom-0 -right-64"
        />
        <div className="absolute w-[400px] h-[400px] bg-yellow-600/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(250,204,21,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <nav className="flex justify-between items-center py-4 px-5 md:px-8 bg-gray-900/70 backdrop-blur-xl rounded-2xl mt-4 border border-yellow-500/30 shadow-2xl shadow-yellow-500/5">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center space-x-4"
          >
            {/* Logo Container */}
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shadow-lg ring-2 ring-yellow-500/60 bg-white flex items-center justify-center">
              <img 
                src="/logo.jpeg?v=1" 
                alt="Omkar Fitness" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.parentElement.innerHTML = '<span class="text-yellow-600 font-black text-lg">OF</span>';
                }}
              />
            </div>
            <div>
              <h1 className="text-white font-black text-lg md:text-2xl tracking-tight">Omkar Fitness</h1>
              <p className="text-yellow-400 text-xs md:text-sm font-semibold">Premium Gym • Dapoli</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex gap-2 md:gap-3"
          >
            <button
              onClick={() => handleNavigation('/login')}
              className="px-4 py-2 md:px-6 md:py-2.5 text-white border border-yellow-500/60 rounded-xl hover:bg-yellow-500/15 transition-all duration-300 text-sm md:text-base font-semibold"
            >
              Login
            </button>
            <button
              onClick={() => handleNavigation('/login')}
              className="px-4 py-2 md:px-6 md:py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-xl hover:shadow-lg hover:shadow-yellow-500/40 transition-all duration-300 text-sm md:text-base font-bold hover:scale-105"
            >
              Join Now
            </button>
          </motion.div>
        </nav>

        {/* Hero Section */}
        <div className="min-h-[85vh] flex flex-col lg:flex-row items-center justify-between gap-12 py-12">
          
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 1 }}
            className="flex-1 text-center lg:text-left space-y-8 w-full"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <span className="inline-block px-5 py-2.5 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold border border-yellow-500/40 backdrop-blur-sm">
                  💪 TRANSFORM YOUR LIFE
                </span>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
                Build Your
                <span className="block bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent mt-2">
                  Dream Body
                </span>
              </h1>
              
              <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Dapoli's premier fitness destination with professional trainers, state-of-the-art equipment, and personalized training programs to help you achieve your goals.
              </p>
            </div>

            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto lg:mx-0">
              <motion.a
                href="tel:8379962283"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4 bg-gray-800/60 backdrop-blur-xl p-5 rounded-2xl border border-yellow-500/30 hover:border-yellow-500/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/20 group cursor-pointer"
              >
                <div className="p-3 bg-yellow-500/20 rounded-xl group-hover:bg-yellow-500/30 transition-all">
                  <Phone className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-left">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Call Us</p>
                  <p className="text-white font-bold text-lg">8379962283</p>
                </div>
              </motion.a>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4 bg-gray-800/60 backdrop-blur-xl p-5 rounded-2xl border border-orange-500/30 hover:border-orange-500/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/20"
              >
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <MapPin className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Location</p>
                  <p className="text-white font-bold text-lg">Dapoli, MH</p>
                </div>
              </motion.div>

              <motion.a
                href="https://instagram.com/omkarfitness_dapoli"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-4 bg-gray-800/60 backdrop-blur-xl p-5 rounded-2xl border border-pink-500/30 hover:border-pink-500/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/20 group cursor-pointer"
              >
                <div className="p-3 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                  <Instagram className="w-5 h-5 text-pink-400" />
                </div>
                <div className="text-left">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Instagram</p>
                  <p className="text-white font-bold text-sm">@omkarfitness_dapoli</p>
                </div>
              </motion.a>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button
                onClick={() => handleNavigation('/login')}
                className="group px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-yellow-500/40 transition-all duration-300 transform hover:scale-105"
              >
                Start Training Today
                <span className="ml-2 group-hover:ml-3 transition-all">→</span>
              </button>
              
              <button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white/5 backdrop-blur-sm text-white rounded-xl font-bold text-lg border border-white/20 hover:bg-white/10 hover:border-yellow-500/40 transition-all duration-300"
              >
                Visit Us
              </button>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10"
            >
              <div className="text-center lg:text-left">
                <h3 className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">500+</h3>
                <p className="text-gray-400 text-sm mt-1 font-semibold">Members</p>
              </div>
              <div className="text-center lg:text-left">
                <h3 className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">15+</h3>
                <p className="text-gray-400 text-sm mt-1 font-semibold">Trainers</p>
              </div>
              <div className="text-center lg:text-left">
                <h3 className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">10+</h3>
                <p className="text-gray-400 text-sm mt-1 font-semibold">Years</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Logo & Contact Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex-1 flex items-center justify-center w-full px-4 lg:px-0"
          >
            <div className="w-full max-w-md relative">
              {/* Glowing background effect */}
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-3xl blur-2xl animate-pulse" />
              
              {/* Main Card */}
              <div className="relative bg-gray-900/90 backdrop-blur-2xl p-8 rounded-3xl border border-yellow-500/40 shadow-2xl shadow-yellow-500/10 flex flex-col items-center space-y-6">
                
                {/* Logo Section */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full"
                >
                  <div className="relative bg-white rounded-2xl p-3 shadow-xl ring-2 ring-yellow-500/50 overflow-hidden">
                    <img 
                      src="/logo.jpeg?v=1" 
                      alt="Omkar Fitness Logo" 
                      className="w-full h-auto object-contain rounded-xl"
                      style={{ minHeight: '180px', maxHeight: '220px' }}
                    />
                  </div>
                </motion.div>
                
                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />
                
                {/* Info Section */}
                <div className="w-full text-center space-y-5">
                  <div>
                    <h2 className="text-2xl font-black text-white mb-1">Omkar Fitness</h2>
                    <p className="text-yellow-400 text-sm font-semibold tracking-wider">PREMIUM GYM AT DAPOLI</p>
                  </div>
                  
                  {/* Address Section */}
                  <div className="bg-gray-800/60 backdrop-blur-sm p-5 rounded-xl border border-yellow-500/20 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-sm">
                      <MapPin className="w-4 h-4" />
                      Location
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-200 text-sm font-medium">2nd floor, JP building</p>
                      <p className="text-gray-200 text-sm font-medium">near Azad maidan</p>
                      <p className="text-gray-200 text-sm font-medium">Dapoli, Maharashtra 415712</p>
                    </div>
                  </div>
                  
                  {/* Contact Section */}
                  <a 
                    href="tel:8379962283" 
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-xl text-gray-900 font-bold text-lg hover:shadow-lg hover:shadow-yellow-500/40 transition-all duration-300 transform hover:scale-105"
                  >
                    <Phone className="w-5 h-5" />
                    8379962283
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="py-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Omkar Fitness?</span>
            </h2>
            <p className="text-gray-400 text-lg font-medium">Professional training with world-class facilities and certified experts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Dumbbell className="w-7 h-7" />, title: "Premium Equipment", description: "State-of-the-art machines and free weights for all fitness levels" },
              { icon: <Users className="w-7 h-7" />, title: "Expert Trainers", description: "Certified professionals dedicated to your fitness journey" },
              { icon: <Target className="w-7 h-7" />, title: "Custom Programs", description: "Personalized workout plans tailored to your goals" },
              { icon: <Award className="w-7 h-7" />, title: "Strength Training", description: "Specialized programs for muscle building and conditioning" },
              { icon: <Salad className="w-7 h-7" />, title: "Nutrition Plans", description: "Expert diet guidance to maximize your results" },
              { icon: <Clock className="w-7 h-7" />, title: "Flexible Timing", description: "Convenient hours to fit your busy schedule" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10 hover:-translate-y-1"
              >
                <div className="text-yellow-400 mb-5 p-3 bg-yellow-500/15 rounded-xl w-fit group-hover:bg-yellow-500/25 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Contact Section */}
        <motion.section
          id="contact"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="py-20"
        >
          <div className="bg-gray-800/50 backdrop-blur-xl p-12 rounded-3xl border border-yellow-500/20 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block p-4 bg-yellow-500/15 rounded-2xl mb-6 border border-yellow-500/30">
                <MapPin className="w-10 h-10 text-yellow-400" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4">Visit Us Today</h2>
              <p className="text-gray-400 text-lg">Start your fitness transformation at Dapoli's best gym</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-yellow-500/15 rounded-xl shrink-0">
                    <Phone className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-1">Call Us</p>
                    <a href="tel:8379962283" className="text-white text-xl font-bold hover:text-yellow-400 transition-colors">
                      8379962283
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-orange-500/15 rounded-xl shrink-0">
                    <MapPin className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-1">Address</p>
                    <p className="text-white font-semibold leading-relaxed">
                      2nd floor, JP building,<br />
                      near Azad maidan,<br />
                      Dapoli, Maharashtra 415712
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.a 
                href="https://instagram.com/omkarfitness_dapoli"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-pink-500/20 hover:border-pink-500/50 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-gradient-to-br from-pink-500/15 to-purple-500/15 rounded-xl shrink-0 group-hover:from-pink-500/25 group-hover:to-purple-500/25 transition-all">
                    <Instagram className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-1">Follow Us</p>
                    <p className="text-white text-lg font-bold group-hover:text-pink-400 transition-colors">
                      @omkarfitness_dapoli
                    </p>
                  </div>
                </div>
              </motion.a>
            </div>

            <div className="text-center">
              <a
                href="https://maps.google.com/?q=2nd+floor,+JP+building,+near+Azad+maidan,+Dapoli,+Maharashtra+415712"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-yellow-500/40 transition-all duration-300 transform hover:scale-105"
              >
                <MapPin className="w-5 h-5" />
                Get Directions
              </a>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-20 text-center"
        >
          <div className="relative bg-gradient-to-r from-yellow-500/15 to-orange-500/15 backdrop-blur-xl p-16 rounded-3xl border border-yellow-500/30 max-w-4xl mx-auto overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(250,204,21,0.1),transparent_50%)]" />
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Ready to Transform?
              </h2>
              <p className="text-gray-300 text-xl max-w-2xl mx-auto">
                Join Omkar Fitness today and achieve your fitness goals with professional guidance and state-of-the-art equipment
              </p>
              <button
                onClick={() => handleNavigation('/login')}
                className="inline-block px-10 py-5 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-yellow-500/40 transition-all duration-300 transform hover:scale-105"
              >
                Join Now →
              </button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="py-8 border-t border-yellow-500/20 text-center space-y-4">
          <div className="flex items-center justify-center gap-6">
            <a href="tel:8379962283" className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors">
              <Phone className="w-4 h-4" />
              8379962283
            </a>
            <a 
              href="https://instagram.com/omkarfitness_dapoli" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
            >
              <Instagram className="w-4 h-4" />
              @omkarfitness_dapoli
            </a>
          </div>
          <p className="text-gray-400 font-medium">&copy; 2026 Omkar Fitness, Dapoli. All rights reserved.</p>
          <p className="text-yellow-400/70 text-sm">📍 2nd floor, JP building, near Azad maidan, Dapoli</p>
        </footer>
      </div>
    </div>
  );
};

export default HeroPage;
