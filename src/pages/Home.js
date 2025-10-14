import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import LiquidEther from '../components/LiquidEther';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleStartChatting = () => {
    // Check if user is logged in
    const lawgptUser = localStorage.getItem("lawgptUser");
    
    if (lawgptUser) {
      // User is logged in, navigate to chat
      navigate('/chat');
    } else {
      // User is not logged in, navigate to login
      navigate('/login');
    }
  };


  return (
    <div id="top" className="relative min-h-screen transition-colors duration-300 overflow-hidden scroll-smooth">
      {/* Liquid Ether Background */}
      <LiquidEther
        mouseForce={20}
        cursorSize={100}
        resolution={0.5}
        autoSpeed={0.5}
        autoIntensity={2.2}
        iterationsPoisson={32}
        isBounce={false}
        autoDemo={true}
        isViscous={false}
        viscous={30}
        iterationsViscous={32}
        className="absolute inset-0 -z-10"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1
        }}
      />
      {/* LAWGPT Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-4 left-4 z-20 flex items-center gap-3"
      >
        <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-2xl font-bold text-primary-600 dark:text-primary-400"
              >
                🤖 LAWGPT
              </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex justify-center mb-12"
      >
        <div className="flex flex-wrap justify-center gap-4 px-5 py-4 rounded-full backdrop-blur-md bg-gray-900/10 dark:bg-white/10 border border-gray-900/20 dark:border-white/20 shadow-lg m-5">
          {[
            { name: 'Home', path: '/home' },
            { name: 'Browser', path: '/browser' },
            { name: 'About Us', path: '/about' },
            { name: 'FAQ', path: '/faq' }
          ].map((item, index) => (
            <motion.button
              key={index}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1 text-gray-900 dark:text-white font-medium transition-all duration-300 group"
            >
              <span className="border-b-4 border-transparent group-hover:border-current transition-all duration-300">
                {item.name}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
      {/* Theme Toggle - Top Right Corner */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="text-8xl mb-8"
            >
              🤖
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              AI Chatbot
              <span className="text-primary-600 dark:text-primary-400"> Assistant</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
              Experience the future of conversation with our intelligent AI chatbot. 
              Get instant responses, helpful assistance, and engaging interactions.
            </p>
          </motion.div>

          {/* Main Action Buttons */}
            <motion.button
              onClick={handleStartChatting}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-lg px-8 py-4 rounded-xl shadow-lg"
            >
              Start Chatting 💬
            </motion.button>
            
        

          {/* Secondary Action Buttons */}

        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-32"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Why Choose Our Chatbot?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                description: "Get instant responses to your questions and requests"
              },
              {
                icon: "🧠",
                title: "Smart AI",
                description: "Powered by advanced AI technology for intelligent conversations"
              },
              {
                icon: "🌙",
                title: "Dark Mode",
                description: "Beautiful interface that adapts to your preferences"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;