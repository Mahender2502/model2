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
        mouseForce={15}
        cursorSize={80}
        resolution={0.3}
        autoSpeed={1.0}
        autoIntensity={1.5}
        iterationsPoisson={16}
        isBounce={false}
        autoDemo={true}
        isViscous={false}
        viscous={20}
        iterationsViscous={16}
        autoResumeDelay={0}
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
            { name: 'About Us', path: '/about' },
            { name: 'Contact', path: '/contact' }
          ].map((item, index) => (
            <motion.button
              key={index}
              onClick={() => {
                if (item.name === 'Contact') {
                  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate(item.path);
                }
              }}
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
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              🏛️ LawGPT — Your AI-Powered Legal Assistant
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto">
              Smarter Legal Research. Faster Case Summaries. Instant Legal Answers.
            </p>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto">
              Welcome to LawGPT, an intelligent AI-driven platform designed to simplify and speed up your legal work. Whether you're a lawyer, a law student, or an individual seeking legal clarity, LawGPT gives you accurate, easy-to-understand, and reliable legal assistance — instantly.
            </p>

          {/* Main Action Buttons */}
            <motion.button
              onClick={handleStartChatting}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-lg px-8 py-4 rounded-xl shadow-lg mb-8"
            >
              👉 Try LawGPT Now
            </motion.button>
            
        

          {/* Secondary Action Buttons */}

        </div>

        {/* Features Section */}
        {/* How LawGPT Helps You Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-32"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            💡 How LawGPT Helps You
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ask Legal Questions</h3>
              <p className="text-gray-600 dark:text-gray-300">Get direct, reliable answers explained in plain English.</p>
            </div>
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Summarize Judgments</h3>
              <p className="text-gray-600 dark:text-gray-300">Upload a case file or judgment and receive a concise summary highlighting key points and precedents.</p>
            </div>
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Draft Legal Documents</h3>
              <p className="text-gray-600 dark:text-gray-300">Generate petitions, contracts, and affidavits in minutes.</p>
            </div>
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Understand the Law</h3>
              <p className="text-gray-600 dark:text-gray-300">Get clear interpretations of complex acts, sections, and clauses.</p>
            </div>
          </div>
          <p className="text-center text-lg text-gray-600 dark:text-gray-300 mt-8 max-w-4xl mx-auto">
            Whether it's Indian Law or International Frameworks, LawGPT adapts to your needs and delivers context-aware responses.
          </p>
        </motion.div>

        {/* Who Can Use LawGPT Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-32"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            🌍 Who Can Use LawGPT?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Lawyers</h3>
              <p className="text-gray-600 dark:text-gray-300">Save time in research and document drafting.</p>
            </div>
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Law Students</h3>
              <p className="text-gray-600 dark:text-gray-300">Simplify case study preparation and learn legal language effectively.</p>
            </div>
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Businesses</h3>
              <p className="text-gray-600 dark:text-gray-300">Generate compliance drafts, NDAs, and contracts with ease.</p>
            </div>
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Citizens</h3>
              <p className="text-gray-600 dark:text-gray-300">Get basic legal awareness and understand your rights without needing a lawyer.</p>
            </div>
          </div>
          
        </motion.div>

        {/* Why Choose LawGPT Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mt-32"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            🔐 Why Choose LawGPT?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Trained on Authentic Data</h3>
              <p className="text-gray-600 dark:text-gray-300">Trained on authentic legal datasets and verified case law.</p>
            </div>
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Continuously Updated</h3>
              <p className="text-gray-600 dark:text-gray-300">Continuously updated with latest amendments and judgments.</p>
            </div>
            <div className="bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Privacy & Confidentiality</h3>
              <p className="text-gray-600 dark:text-gray-300">Works with data privacy and confidentiality at its core — your queries stay private.</p>
            </div>
          </div>
          
        </motion.div>

        {/* Contact Details Section */}
        <motion.div
          id="contact"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-32 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            📞 Contact Us
          </h2>
          
          <div className="max-w-4xl mx-auto bg-[#E5E5E5] dark:bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-center space-x-3">
      
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">Email</p>
                  <a href="mailto:support@lawgpt.in" className="text-primary-600 dark:text-primary-400 hover:underline">
                    support@lawgpt.in
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">💼</span>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">LinkedIn</p>
                  <a href="https://linkedin.com/company/lawgpt" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                    LawGPT
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🐦</span>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">Twitter (X)</p>
                  <a href="https://twitter.com/LawGPT_AI" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                    @LawGPT_AI
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🔗</span>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">GitHub</p>
                  <a href="https://github.com/Lawgpt" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                    github.com/Lawgpt
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
);
}
export default Home;