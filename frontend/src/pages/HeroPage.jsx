import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Award, Users, Dumbbell, Target, Clock, Salad, Instagram, Star, Quote, Calendar, Zap } from 'lucide-react';

const HeroPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Rahul Patil",
      role: "Member since 2023",
      image: "RP",
      text: "Omkar Fitness completely transformed my fitness journey. The trainers are incredibly knowledgeable and supportive. Lost 15kg in 6 months!",
      rating: 5
    },
    {
      name: "Priya Sharma",
      role: "Member since 2022",
      image: "PS",
      text: "Best gym in Dapoli! The equipment is top-notch and the environment is very motivating. Highly recommend for anyone serious about fitness.",
      rating: 5
    },
    {
      name: "Amit Deshmukh",
      role: "Member since 2024",
      image: "AD",
      text: "The personalized training programs here are amazing. The trainers really understand individual needs and create perfect workout plans.",
      rating: 5
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20,
        y: (e.clientY / window.innerHeight) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Auto-rotate testimonials
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(testimonialInterval);
    };
  }, []);

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  const features = [
    { icon: <Dumbbell className="w-7 h-7" />, title: "Premium Equipment", description: "State-of-the-art machines and free weights for all fitness levels", color: "yellow" },
    { icon: <Users className="w-7 h-7" />, title: "Expert Trainers", description: "Certified professionals dedicated to your fitness journey", color: "blue" },
    { icon: <Target className="w-7 h-7" />, title: "Custom Programs", description: "Personalized workout plans tailored to your goals", color: "green" },
    { icon: <Zap className="w-7 h-7" />, title: "Strength Training", description: "Specialized programs for muscle building and conditioning", color: "purple" },
    { icon: <Salad className="w-7 h-7" />, title: "Nutrition Plans", description: "Expert diet guidance to maximize your results", color: "emerald" },
    { icon: <Clock className="w-7 h-7" />, title: "Flexible Timing", description: "Open 6 AM - 10 PM to fit your busy schedule", color: "orange" }
  ];

  const getColorClasses = (color) => {
    const colors = {
      yellow: { bg: "bg-yellow-500/15", hover: "hover:border-yellow-500/50", text: "text-yellow-400", glow: "hover:shadow-yellow-500/10" },
      blue: { bg: "bg-blue-500/15", hover: "hover:border-blue-500/50", text: "text-blue-400", glow: "hover:shadow-blue-500/10" },
      green: { bg: "bg-green-500/15", hover: "hover:border-green-500/50", text: "text-green-400", glow: "hover:shadow-green-500/10" },
      purple: { bg: "bg-purple-500/15", hover: "hover:border-purple-500/50", text: "text-purple-400", glow: "hover:shadow-purple-500/10" },
      emerald: { bg: "bg-emerald-500/15", hover: "hover:border-emerald-500/50", text: "text-emerald-400", glow: "hover:shadow-emerald-500/10" },
      orange: { bg: "bg-orange-500/15", hover: "hover:border-orange-500/50", text: "text-orange-400", glow: "hover:shadow-orange-500/10" }
    };
    return colors[color] || colors.yellow;
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

            {/* Quick Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="flex flex-wrap justify-center lg:justify-start gap-6"
            >
              <div className="flex items-center gap-3 bg-gray-800/50 px-5 py-3 rounded-xl border border-yellow-500/20">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">500+</p>
                  <p className="text-gray-400 text-xs font-semibold">Members</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/50 px-5 py-3 rounded-xl border border-blue-500/20">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">15+</p>
                  <p className="text-gray-400 text-xs font-semibold">Trainers</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/50 px-5 py-3 rounded-xl border border-green-500/20">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">10+</p>
                  <p className="text-gray-400 text-xs font-semibold">Years</p>
                </div>
              </div>
            </motion.div>

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

            {/* Contact Cards */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <motion.a
                href="tel:8379962283"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-3 bg-gray-800/40 backdrop-blur-sm px-4 py-3 rounded-xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all group cursor-pointer"
              >
                <Phone className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-semibold">8379962283</span>
              </motion.a>
              
              <motion.a
                href="https://instagram.com/omkarfitness_dapoli"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-3 bg-gray-800/40 backdrop-blur-sm px-4 py-3 rounded-xl border border-pink-500/20 hover:border-pink-500/50 transition-all group cursor-pointer"
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                <span className="text-white font-semibold">@omkarfitness_dapoli</span>
              </motion.a>
            </div>
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
                  
                  {/* Working Hours */}
                  <div className="bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-green-500/20 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-sm">
                      <Clock className="w-4 h-4" />
                      Working Hours
                    </div>
                    <div className="flex justify-between text-sm px-2">
                      <span className="text-gray-400">Mon - Sat</span>
                      <span className="text-white font-semibold">6 AM - 10 PM</span>
                    </div>
                    <div className="flex justify-between text-sm px-2">
                      <span className="text-gray-400">Sunday</span>
                      <span className="text-white font-semibold">7 AM - 12 PM</span>
                    </div>
                  </div>
                  
                  {/* Address Section */}
                  <div className="bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-yellow-500/20 space-y-2">
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
            {features.map((feature, index) => {
              const colorClasses = getColorClasses(feature.color);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`group bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 ${colorClasses.hover} transition-all duration-300 hover:shadow-xl ${colorClasses.glow} hover:-translate-y-1`}
                >
                  <div className={`${colorClasses.text} mb-5 p-3 ${colorClasses.bg} rounded-xl w-fit group-hover:scale-110 transition-all duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="py-20"
        >
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-bold border border-purple-500/30 mb-4">
              ⭐ MEMBER REVIEWS
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              What Our <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Members Say</span>
            </h2>
            <p className="text-gray-400 text-lg font-medium">Real stories from real members who transformed their lives</p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Main Testimonial Card */}
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="relative bg-gray-800/50 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-purple-500/20"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-purple-500/20">
                <Quote className="w-16 h-16" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Quote Text */}
              <p className="text-white text-xl md:text-2xl font-medium leading-relaxed mb-8">
                "{testimonials[currentTestimonial].text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {testimonials[currentTestimonial].image}
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">{testimonials[currentTestimonial].name}</h4>
                  <p className="text-gray-400">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
            </motion.div>

            {/* Testimonial Navigation Dots */}
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentTestimonial === index
                      ? 'bg-purple-500 w-8'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="p-3 bg-yellow-500/15 rounded-xl">
                    <Phone className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-1">Call Us</p>
                    <a href="tel:8379962283" className="text-white text-lg font-bold hover:text-yellow-400 transition-colors">
                      8379962283
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-green-500/20 hover:border-green-500/50 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="p-3 bg-green-500/15 rounded-xl">
                    <Clock className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-1">Working Hours</p>
                    <p className="text-white font-bold">6 AM - 10 PM</p>
                    <p className="text-gray-400 text-sm">Mon - Sat</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="p-3 bg-orange-500/15 rounded-xl">
                    <MapPin className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-1">Address</p>
                    <p className="text-white font-semibold text-sm">
                      2nd floor, JP building<br />
                      Near Azad Maidan, Dapoli
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.a 
                href="https://instagram.com/omkarfitness_dapoli"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-pink-500/20 hover:border-pink-500/50 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-pink-500/15 to-purple-500/15 rounded-xl group-hover:from-pink-500/25 group-hover:to-purple-500/25 transition-all">
                    <Instagram className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-1">Follow Us</p>
                    <p className="text-white font-bold group-hover:text-pink-400 transition-colors">
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
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="inline-block px-10 py-5 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-yellow-500/40 transition-all duration-300 transform hover:scale-105"
                >
                  Join Now →
                </button>
                <a
                  href="tel:8379962283"
                  className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white/10 text-white rounded-xl font-bold text-xl border border-white/20 hover:bg-white/20 transition-all"
                >
                  <Phone className="w-5 h-5" />
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="py-12 border-t border-yellow-500/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg ring-2 ring-yellow-500/60 bg-white flex items-center justify-center">
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
                  <h3 className="text-white font-black text-xl">Omkar Fitness</h3>
                  <p className="text-yellow-400 text-sm">Premium Gym • Dapoli</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-sm">
                Your premier fitness destination in Dapoli. Transform your body and mind with our expert trainers and state-of-the-art equipment.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => handleNavigation('/login')} className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                    Member Login
                  </button>
                </li>
                <li>
                  <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                    Contact Us
                  </button>
                </li>
                <li>
                  <a href="https://instagram.com/omkarfitness_dapoli" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition-colors text-sm">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <ul className="space-y-3">
                <li>
                  <a href="tel:8379962283" className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                    <Phone className="w-4 h-4" />
                    8379962283
                  </a>
                </li>
                <li className="flex items-start gap-2 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>2nd floor, JP building, near Azad maidan, Dapoli, MH 415712</span>
                </li>
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>6 AM - 10 PM (Mon-Sat)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">&copy; 2026 Omkar Fitness, Dapoli. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a 
                href="https://instagram.com/omkarfitness_dapoli" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-pink-400 hover:bg-gray-700 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="tel:8379962283"
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-gray-700 transition-all"
              >
                <Phone className="w-5 h-5" />
              </a>
              <a 
                href="https://maps.google.com/?q=2nd+floor,+JP+building,+near+Azad+maidan,+Dapoli,+Maharashtra+415712"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-orange-400 hover:bg-gray-700 transition-all"
              >
                <MapPin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HeroPage;
