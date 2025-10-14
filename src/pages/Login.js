import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBubbleParticles from '../components/AnimatedBubbleParticles';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!validateEmail(formData.email)) {
      setErrorMsg('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || "Login failed");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.user.email);
        navigate("/chat");
      }
    } catch (err) {
      setErrorMsg("Error connecting to server");
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Initiating ${provider} login...`);
    // Implement OAuth flow here
  };

  // Memoized background to avoid re-renders
  const memoizedBubbleParticles = useMemo(() => (
    <AnimatedBubbleParticles
      className="absolute inset-0"
      backgroundColor="rgba(0, 0, 0, 0)"
      particleColor="#ffffff"
      particleSize={30}
      spawnInterval={400}
      blurStrength={8}
      scaleRange={{ min: 0.3, max: 1.8 }}
      friction={{ min: 1, max: 2.5 }}
    />
  ), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Bubble Particles Background - Memoized */}
      {memoizedBubbleParticles}

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10"
        >
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-4 shadow-xl"
            >
              <span className="text-3xl">⚖️</span>
            </motion.div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              LAWGPT
            </h1>
            <p className="text-gray-300 mt-2 font-medium">Welcome Back!</p>
            <p className="text-gray-400 text-sm">Your AI Legal Assistant</p>
          </motion.div>

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-3 rounded-lg mb-6"
            >
              <div className="flex">
                <span className="mr-2">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative"
            >
              <input
                type="email"
                name="email"
                className="w-full px-4 py-3 bg-transparent border-2 border-gray-700 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                required
                aria-label="Email Address"
              />
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="relative"
            >
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="w-full px-4 py-3 pr-12 bg-transparent border-2 border-gray-700 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-indigo-400 transition-colors"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </motion.div>

            {/* Remember Me & Forgot Password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex items-center justify-between"
            >
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="mr-2 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-2 border-gray-700 bg-transparent"
                />
                <span className="text-gray-300 text-sm">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
              >
                Forgot Password?
              </Link>
            </motion.div>

            {/* Login Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <span className={loading ? 'invisible' : 'visible'}>
                {loading ? 'Signing In...' : 'Sign In'}
              </span>
            </motion.button>
          </form>

          {/* Sign Up Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="text-center mt-8 space-y-4"
          >
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Create one here
              </Link>
            </p>

           
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;