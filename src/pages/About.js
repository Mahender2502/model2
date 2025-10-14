import React from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';

const About = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Theme Toggle - Top Right Corner */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About Our Chatbot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Learn more about the technology and vision behind our AI-powered chatbot application.
          </p>
        </motion.div>

        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🚀 Our Mission
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We're dedicated to creating intuitive and intelligent conversational experiences. 
              Our chatbot is designed to be your helpful digital assistant, providing quick responses 
              and engaging interactions whenever you need them.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🛠️ Technology Stack
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Frontend</h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• React 18</li>
                  <li>• TailwindCSS</li>
                  <li>• Framer Motion</li>
                  <li>• React Router</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Features</h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Dark Mode Support</li>
                  <li>• Responsive Design</li>
                  <li>• Local Storage</li>
                  <li>• Smooth Animations</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ✨ Key Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Persistent Chat History",
                  description: "Your conversations are saved locally and persist across sessions"
                },
                {
                  title: "Responsive Design",
                  description: "Works seamlessly on desktop, tablet, and mobile devices"
                },
                {
                  title: "Dark Mode",
                  description: "Toggle between light and dark themes with your preference saved"
                },
                {
                  title: "Smooth Animations",
                  description: "Beautiful transitions and micro-interactions enhance the experience"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🎯 Future Roadmap
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We're constantly working to improve the chatbot experience with new features and capabilities.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Voice Input', 'File Sharing', 'Multi-language', 'Custom Themes'].map((feature, index) => (
                <motion.span
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                >
                  {feature}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;
