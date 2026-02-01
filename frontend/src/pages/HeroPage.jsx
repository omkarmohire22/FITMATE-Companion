import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Award, Users, Dumbbell, Target, Clock, Salad, Instagram, Star, Quote, Calendar, Zap, ArrowRight, ChevronRight, CheckCircle2 } from 'lucide-react';

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
    { icon: <Dumbbell className="w-8 h-8" />, title: "Premium Equipment", description: "State-of-the-art machines and free weights for all fitness levels", color: "yellow" },
    { icon: <Users className="w-8 h-8" />, title: "Expert Trainers", description: "Certified professionals dedicated to your fitness journey", color: "blue" },
    { icon: <Target className="w-8 h-8" />, title: "Custom Programs", description: "Personalized workout plans tailored to your goals", color: "green" },
    { icon: <Zap className="w-8 h-8" />, title: "Strength Training", description: "Specialized programs for muscle building and conditioning", color: "purple" },
    { icon: <Salad className="w-8 h-8" />, title: "Nutrition Plans", description: "Expert diet guidance to maximize your results", color: "emerald" },
    { icon: <Clock className="w-8 h-8" />, title: "Flexible Timing", description: "Open 6 AM - 10 PM to fit your busy schedule", color: "orange" }
  ];

  const getColorClasses = (color) => {
    const colors = {
      yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", hover: "hover:border-yellow-500/50", text: "text-yellow-400", shadow: "shadow-yellow-500/10", iconBg: "bg-yellow-500/20" },
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", hover: "hover:border-blue-500/50", text: "text-blue-400", shadow: "shadow-blue-500/10", iconBg: "bg-blue-500/20" },
      green: { bg: "bg-green-500/10", border: "border-green-500/20", hover: "hover:border-green-500/50", text: "text-green-400", shadow: "shadow-green-500/10", iconBg: "bg-green-500/20" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", hover: "hover:border-purple-500/50", text: "text-purple-400", shadow: "shadow-purple-500/10", iconBg: "bg-purple-500/20" },
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", hover: "hover:border-emerald-500/50", text: "text-emerald-400", shadow: "shadow-emerald-500/10", iconBg: "bg-emerald-500/20" },
      orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", hover: "hover:border-orange-500/50", text: "text-orange-400", shadow: "shadow-orange-500/10", iconBg: "bg-orange-500/20" }
    };
    return colors[color] || colors.yellow;
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-yellow-500/30">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{ x: mousePosition.x * -1, y: mousePosition.y * -1 }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
          className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-yellow-600/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: mousePosition.x, y: mousePosition.y }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
          className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

        {/* Navigation */}
        <nav className="flex items-center justify-between py-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/10 ring-2 ring-yellow-500/20 overflow-hidden">
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
              <h1 className="text-xl font-black tracking-tight text-white leading-none">Omkar Fitness</h1>
              <p className="text-yellow-400 text-xs font-bold tracking-widest uppercase mt-1">Premium Gym • Dapoli</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <button
              onClick={() => handleNavigation('/login')}
              className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 border border-white/10 rounded-xl hover:bg-white/5 hover:border-yellow-500/50"
            >
              Login
            </button>
            <button
              onClick={() => handleNavigation('/login')}
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-gray-900 transition-all duration-200 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-yellow-500/25 hover:scale-105 active:scale-95"
            >
              Join Now
            </button>
          </motion.div>
        </nav>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[85vh] py-12 lg:py-0 gap-16 xl:gap-24">

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-bold tracking-wide"
              >
                <Zap className="w-4 h-4 fill-yellow-400" />
                TRANSFORM YOUR LIFE TODAY
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
                Build Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 animate-gradient-x">
                  Dream Body
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Dapoli's premier fitness destination. Experience world-class equipment, expert training, and a community that drives you to succeed.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button
                onClick={() => handleNavigation('/login')}
                className="w-full sm:w-auto px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 flex items-center justify-center gap-2 group"
              >
                Start Training
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl border border-white/10 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Visit Gym
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-8 flex items-center justify-center lg:justify-start gap-8 border-t border-white/10"
            >
              {[
                { number: "500+", label: "Active Members" },
                { number: "15+", label: "Expert Trainers" },
                { number: "10+", label: "Years Excellence" }
              ].map((stat, idx) => (
                <div key={idx} className="text-center lg:text-left">
                  <p className="text-3xl font-black text-white">{stat.number}</p>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Visual/Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 w-full max-w-lg relative"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 rounded-[2.5rem] blur-3xl transform rotate-6" />

            <div className="relative bg-[#1A1B1E] border border-white/5 p-8 rounded-[2rem] shadow-2xl overflow-hidden">
              <div className="flex flex-col items-center text-center space-y-8">

                {/* Logo Container */}
                <div className="relative w-full aspect-[4/3] bg-white rounded-2xl p-6 shadow-xl overflow-hidden flex items-center justify-center">
                  <img
                    src="/logo.jpeg?v=1"
                    alt="Omkar Fitness Logo"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white">Omkar Fitness</h2>
                  <p className="text-gray-400 font-bold tracking-widest text-xs uppercase">EST. 2016 • DAPOLI</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-[#25262B] p-4 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors">
                    <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-white font-bold">06:00 AM</p>
                    <p className="text-xs text-gray-500">Opening Time</p>
                  </div>
                  <div className="bg-[#25262B] p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                    <MapPin className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-white font-bold">Dapoli</p>
                    <p className="text-xs text-gray-500">Azad Maidan</p>
                  </div>
                </div>

                <a
                  href="tel:8379962283"
                  className="w-full py-4 bg-[#25262B] hover:bg-[#2C2E33] text-white font-bold rounded-xl border border-white/5 transition-all flex items-center justify-center gap-3 group"
                >
                  <Phone className="w-5 h-5 text-yellow-500 group-hover:rotate-12 transition-transform" />
                  +91 83799 62283
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <section className="py-24 relative">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Why Choose <span className="text-yellow-500">Omkar Fitness?</span>
            </h2>
            <p className="text-gray-400 text-lg">
              We provide everything you need to reach your fitness goals, from expert guidance to top-tier equipment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const style = getColorClasses(feature.color);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`group relative p-8 rounded-[2rem] bg-[#1A1B1E] border border-white/5 hover:bg-[#25262B] transition-all duration-300 hover:-translate-y-1 ${style.hover}`}
                >
                  <div className={`w-16 h-16 rounded-2xl ${style.iconBg} ${style.text} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-yellow-500/5 -skew-y-3 transform origin-left scale-110" />

          <div className="relative z-10 max-w-5xl mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-yellow-500 font-bold tracking-widest text-sm uppercase mb-2 block">Success Stories</span>
              <h2 className="text-4xl md:text-5xl font-black text-white"> Member Reviews</h2>
            </div>

            <div className="relative bg-[#1A1B1E] border border-white/5 rounded-[2.5rem] p-8 md:p-16 text-center shadow-2xl">
              <Quote className="w-16 h-16 text-yellow-500/20 mx-auto mb-8" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <p className="text-2xl md:text-4xl font-bold text-white leading-tight">
                    "{testimonials[currentTestimonial].text}"
                  </p>

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-1">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{testimonials[currentTestimonial].name}</h4>
                      <p className="text-gray-500">{testimonials[currentTestimonial].role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Dots */}
              <div className="flex justify-center gap-3 mt-12">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`transition-all duration-300 rounded-full ${currentTestimonial === index ? 'w-8 h-2 bg-yellow-500' : 'w-2 h-2 bg-gray-700 hover:bg-gray-600'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact/Location Section */}
        <section id="contact" className="py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">

            {/* Left Content */}
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1]">
                  Visit Us Today & <br />
                  <span className="text-yellow-500">Start Your Journey</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-md">
                  Conveniently located near Azad Maidan. Drop by for a tour of our facilities and meet our expert trainers.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 bg-[#1A1B1E] p-6 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all group">
                  <div className="bg-yellow-500/10 p-4 rounded-xl group-hover:bg-yellow-500/20 transition-colors">
                    <MapPin className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Location</h3>
                    <p className="text-gray-400 leading-relaxed text-sm">2nd floor, JP building, near Azad maidan,<br />Dapoli, Maharashtra 415712</p>
                    <a
                      href="https://maps.google.com/?q=2nd+floor,+JP+building,+near+Azad+maidan,+Dapoli,+Maharashtra+415712"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-yellow-500 mt-3 text-sm font-bold hover:text-yellow-400 transition-colors"
                    >
                      Get Directions <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-[#1A1B1E] p-6 rounded-2xl border border-white/5 hover:border-green-500/20 transition-all group">
                  <div className="bg-green-500/10 p-4 rounded-xl group-hover:bg-green-500/20 transition-colors">
                    <Clock className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Opening Hours</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p className="flex justify-between w-48"><span className="text-white font-medium">Mon - Sat:</span> 6 AM - 10 PM</p>
                      <p className="flex justify-between w-48"><span className="text-white font-medium">Sunday:</span> close </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quick Action Cards */}
              <motion.a
                whileHover={{ scale: 1.02 }}
                href="tel:8379962283"
                className="bg-[#242E3B] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center justify-center gap-4 hover:bg-[#2A3645] transition-colors aspect-square sm:aspect-auto sm:h-64"
              >
                <Phone className="w-10 h-10 text-yellow-500" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">CALL US</p>
                  <p className="text-xl font-black text-white">83799 62283</p>
                </div>
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.02 }}
                href="https://instagram.com/omkarfitness_dapoli"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#2E1A47] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center justify-center gap-4 hover:bg-[#381E57] transition-colors aspect-square sm:aspect-auto sm:h-64"
              >
                <Instagram className="w-10 h-10 text-pink-500" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">FOLLOW US</p>
                  <p className="text-xl font-black text-white">@omkarfitness</p>
                </div>
              </motion.a>

              <div className="sm:col-span-2 bg-gradient-to-r from-yellow-500 to-orange-500 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-lg shadow-orange-500/20">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Ready to Start?</h3>
                  <p className="text-gray-900/80 font-bold">Join us today and transform your physique.</p>
                </div>
                <button
                  onClick={() => handleNavigation('/login')}
                  className="relative z-10 px-8 py-3 bg-white text-gray-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                >
                  Join Now
                </button>
                {/* Decor elements */}
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              </div>
            </div>

          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/10 text-gray-400 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/logo.jpeg?v=1" className="w-full h-full object-cover" alt="OF" />
                </div>
                <span className="text-white font-black text-lg">Omkar Fitness</span>
              </div>
              <p className="max-w-xs leading-relaxed">
                Empowering your fitness journey with professional training and world-class facilities in Dapoli.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-base">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => handleNavigation('/login')} className="hover:text-yellow-400 transition-colors">Login</button></li>
                <li><button onClick={() => handleNavigation('/login')} className="hover:text-yellow-400 transition-colors">Sign Up</button></li>
                <li><button onClick={() => document.getElementById('contact')?.scrollIntoView()} className="hover:text-yellow-400 transition-colors">Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-base">Contact</h4>
              <ul className="space-y-2">
                <li>+91 83799 62283</li>
                <li>omkarfitness@example.com</li>
                <li>Dapoli, Maharashtra</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-white/10">
            <p>&copy; {new Date().getFullYear()} Omkar Fitness. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="https://instagram.com/omkarfitness_dapoli" className="hover:text-pink-400 transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="tel:8379962283" className="hover:text-yellow-400 transition-colors"><Phone className="w-5 h-5" /></a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default HeroPage;
