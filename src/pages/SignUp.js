import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBubbleParticles from '../components/AnimatedBubbleParticles';
import debounce from 'lodash/debounce';

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    email: '',
    userType: '',
    password: '',
    confirmPassword: '',
    newsletter: false,
    agreeTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [fieldValidation, setFieldValidation] = useState({});
  const navigate = useNavigate();
  const roleRef = useRef(null);
  const [roleOpen, setRoleOpen] = useState(false);

  // Memoize AnimatedBubbleParticles to prevent re-renders
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

  // Roles list for custom dropdown
  const roles = useMemo(
    () => [
      { value: 'lawyer', label: 'Lawyer' },
      { value: 'law_student', label: 'Law Student' },
      { value: 'paralegal', label: 'Paralegal' },
      { value: 'legal_researcher', label: 'Legal Researcher' },
      { value: 'business_owner', label: 'Business Owner' },
      { value: 'individual', label: 'Individual' },
      { value: 'other', label: 'Other' },
    ],
    []
  );

  // Close custom dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced validation to optimize performance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validateField = useCallback(
    debounce((fieldName, value, passwordValue) => {
      let isValid = true;
      let message = '';

      switch (fieldName) {
        case 'firstName':
        case 'lastName':
          isValid = value.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(value);
          message = isValid ? 'Valid name' : 'Name must be at least 2 letters and contain only letters';
          break;
        case 'mobileNumber':
          isValid = /^\+?[\d\s\-\(\)]{10,}$/.test(value.replace(/\s/g, ''));
          message = isValid ? 'Valid mobile number' : 'Please enter a valid mobile number (at least 10 digits)';
          break;
        case 'password':
          const strength = checkPasswordStrength(value);
          setPasswordStrength(strength.score);
          isValid = strength.score >= 3;
          message = isValid ? 'Strong password' : 'Password is too weak';
          break;
        case 'confirmPassword':
          isValid = value === passwordValue && value.length > 0;
          message = isValid ? 'Passwords match' : 'Passwords do not match';
          break;
        default:
          break;
      }

      setFieldValidation((prev) => ({
        ...prev,
        [fieldName]: { isValid, message },
      }));
    }, 300),
    []
  );

  const handleChange = (e) => {
    // const { name, value, type, checked } = e.target;
    // const newValue = type === 'checkbox' ? checked : value;

    // setFormData((prev) => ({
    //   ...prev,
    //   [name]: newValue,
    // }));

    // validateField(name, newValue);
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    const updatedFormData = {
      ...formData,
      [name]: newValue,
    };

    setFormData(updatedFormData);

    // Pass the correct password value for validation
    if (name === 'confirmPassword') {
      validateField(name, newValue, updatedFormData.password);
    } else if (name === 'password') {
      validateField(name, newValue);
      // Also revalidate confirm password if it exists
      if (updatedFormData.confirmPassword) {
        validateField('confirmPassword', updatedFormData.confirmPassword, newValue);
      }
    } else {
      validateField(name, newValue);
    }
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    return { score };
  };

  const updateFormProgress = useCallback(() => {
    const requiredFields = [
      'firstName',
      'lastName',
      'mobileNumber',
      'email',
      'userType',
      'password',
      'confirmPassword',
      'agreeTerms',
    ];
    const filledFields = requiredFields.filter((field) => {
      if (field === 'agreeTerms') return formData[field];
      return formData[field]?.toString().trim() !== '';
    });
    const progress = (filledFields.length / requiredFields.length) * 100;
    setFormProgress(progress);
  }, [formData]);

  useEffect(() => {
    updateFormProgress();
  }, [updateFormProgress]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    // Comprehensive validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg('Please enter your full name');
      setLoading(false);
      return;
    }

    if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.mobileNumber.replace(/\s/g, ''))) {
      setErrorMsg('Please enter a valid mobile number');
      setLoading(false);
      return;
    }

    if (!formData.userType) {
      setErrorMsg('Please select your role');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setErrorMsg('Please create a stronger password');
      setLoading(false);
      return;
    }

    if (!formData.agreeTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      mobileNumber: formData.mobileNumber,
      email: formData.email,
      userType: formData.userType,
      password: formData.password,
      newsletter: formData.newsletter,
    };

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Signup failed');
      } else {
        setSuccessMsg('Account created successfully!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setErrorMsg('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Removed unused handleSocialSignup to satisfy linter

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Bubble Particles Background - Memoized to prevent re-renders */}
      {memoizedBubbleParticles}

      <div
        className="relative z-10 w-full max-w-md bg-black/30 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10"
        role="form"
        aria-label="Sign Up Form"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-4 shadow-xl"
          >
            <span className="text-4xl" role="img" aria-label="Scales of Justice">
              ⚖️
            </span>
          </motion.div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            LAWGPT
          </h1>
          <p className="text-gray-300 mt-2 font-medium">Join the Legal Revolution</p>
          <p className="text-gray-400 text-sm">Your AI-powered legal assistant awaits</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="relative mb-8">
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${formProgress}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right font-medium">
            {Math.round(formProgress)}% Complete
          </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 rounded-lg mb-6"
              role="alert"
            >
              <div className="flex items-center">
                <span className="mr-3 text-lg" role="img" aria-label="Warning">
                  ⚠️
                </span>
                <span>{errorMsg}</span>
              </div>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-green-900/50 border-l-4 border-green-500 text-green-200 p-4 rounded-lg mb-6"
              role="alert"
            >
              <div className="flex items-center">
                <span className="mr-3 text-lg" role="img" aria-label="Success">
                  ✅
                </span>
                <span>{successMsg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration Form */}
        <div role="form" aria-label="Sign Up Form">
          <div className="space-y-6">
            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <input
                  type="text"
                  name="firstName"
                  className="w-full px-4 py-3 bg-transparent border-2 border-gray-700 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  required
                  aria-label="First Name"
                />
                {fieldValidation.firstName && (
                  <span
                    className={`absolute right-3 top-3.5 ${
                      fieldValidation.firstName.isValid ? 'text-green-400' : 'text-red-400'
                    }`}
                    aria-hidden="true"
                  >
                    {fieldValidation.firstName.isValid ? '✓' : '✗'}
                  </span>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="relative"
              >
                <input
                  type="text"
                  name="lastName"
                  className="w-full px-4 py-3 bg-transparent border-2 border-gray-700 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  required
                  aria-label="Last Name"
                />
                {fieldValidation.lastName && (
                  <span
                    className={`absolute right-3 top-3.5 ${
                      fieldValidation.lastName.isValid ? 'text-green-400' : 'text-red-400'
                    }`}
                    aria-hidden="true"
                  >
                    {fieldValidation.lastName.isValid ? '✓' : '✗'}
                  </span>
                )}
              </motion.div>
            </div>

            {/* Mobile Number Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative"
            >
              <input
                type="tel"
                name="mobileNumber"
                className="w-full px-4 py-3 bg-transparent border-2 border-gray-700 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="Mobile Number"
                required
                aria-label="Mobile Number"
              />
              {fieldValidation.mobileNumber && (
                <span
                  className={`absolute right-3 top-3.5 ${
                    fieldValidation.mobileNumber.isValid ? 'text-green-400' : 'text-red-400'
                  }`}
                  aria-hidden="true"
                >
                  {fieldValidation.mobileNumber.isValid ? '✓' : '✗'}
                </span>
              )}
            </motion.div>

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
              {fieldValidation.email && (
                <span
                  className={`absolute right-3 top-3.5 ${
                    fieldValidation.email.isValid ? 'text-green-400' : 'text-red-400'
                  }`}
                  aria-hidden="true"
                >
                  {fieldValidation.email.isValid ? '✓' : '✗'}
                </span>
              )}
            </motion.div>

            {/* User Type Field (Custom Transparent Dropdown) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className={`relative ${roleOpen ? 'z-50' : ''}`}
            >
              <div className={`relative ${roleOpen ? 'z-50' : ''}`} ref={roleRef}>
                <button
                  type="button"
                  onClick={() => setRoleOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={roleOpen}
                  aria-label="User Role"
                  className="w-full text-left pl-4 pr-10 py-3 bg-gray-900 hover:bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 text-white cursor-pointer"
                >
                  <span className={formData.userType ? 'text-white' : 'text-gray-400'}>
                    {formData.userType ? roles.find(r => r.value === formData.userType)?.label : 'Select your role'}
                  </span>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {roleOpen && (
                  // <ul
                  //   role="listbox"
                  //   tabIndex={-1}
                  //   className="absolute z-30 mt-2 w-full max-h-60 overflow-auto rounded-xl border-2 border-gray-700 bg-gray-900 text-gray-200 shadow-2xl backdrop-blur-none opacity-100 divide-y divide-gray-800 mix-blend-normal isolate"
                  //   style={{ backgroundColor: '#111827', opacity: 1 }}
                  // >
                  //   {roles.map((r) => (
                  //     <li
                  //       key={r.value}
                  //       role="option"
                  //       aria-selected={formData.userType === r.value}
                  //       onClick={() => {
                  //         setFormData((prev) => ({ ...prev, userType: r.value }));
                  //         setRoleOpen(false);
                  //         validateField('userType', r.value);
                  //       }}
                  //       className={`px-4 py-2 cursor-pointer transition-colors duration-150 bg-gray-900 hover:bg-gray-800 opacity-100 border-0 ${formData.userType === r.value ? 'bg-indigo-600 text-white' : ''}`}
                  //       style={{ backgroundColor: formData.userType === r.value ? '#4f46e5' : '#111827', opacity: 1 }}
                  //     >
                  //       {r.label}
                  //     </li>
                  //   ))}
                  // </ul>
                  <ul
  role="listbox"
  tabIndex={-1}
  className="absolute z-50 mt-2 w-full max-h-60 overflow-auto 
             rounded-xl border border-gray-700 
             bg-gray-900 text-gray-200 shadow-lg mix-blend-normal"
  style={{ isolation: 'isolate', backgroundColor: '#111827' }}
>
  {roles.map((r) => (
    <li
      key={r.value}
      role="option"
      aria-selected={formData.userType === r.value}
      onClick={() => {
        setFormData((prev) => ({ ...prev, userType: r.value }));
        setRoleOpen(false);
        validateField('userType', r.value);
      }}
      className={`block w-full px-4 py-2 cursor-pointer transition-colors duration-150 bg-gray-900 ${
        formData.userType === r.value
          ? 'bg-indigo-600 text-white'
          : 'hover:bg-gray-800'
      }`}
      style={{ backgroundColor: formData.userType === r.value ? '#4f46e5' : '#111827' }}
    >
      {r.label}
    </li>
  ))}
</ul>

                )}
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="relative"
            >
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="w-full px-4 py-3 bg-transparent border-2 border-gray-700 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 text-white placeholder-gray-400 pr-12"
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Strength:</span>
                    <span
                      className={`font-medium ${
                        passwordStrength >= 3 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded transition-colors duration-300 ${
                          level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="relative"
            >
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="w-full px-4 py-3 bg-transparent border-2 border-gray-700 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 text-white placeholder-gray-400 pr-12"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  required
                  aria-label="Confirm Password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-indigo-400 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldValidation.confirmPassword && formData.confirmPassword && (
                <span
                  className={`absolute right-12 top-3.5 ${
                    fieldValidation.confirmPassword.isValid ? 'text-green-400' : 'text-red-400'
                  }`}
                  aria-hidden="true"
                >
                  {fieldValidation.confirmPassword.isValid ? '✓' : '✗'}
                </span>
              )}
            </motion.div>

            {/* Checkboxes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="space-y-4"
            >
              <label className="flex items-start cursor-pointer text-sm">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mr-3 mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-2 border-gray-700 bg-transparent"
                  required
                  aria-label="Agree to Terms of Service and Privacy Policy"
                />
                <span className="text-gray-300 leading-relaxed">
                  I agree to the{' '}
                  <Link to="" className="text-indigo-400 hover:underline font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="" className="text-indigo-400 hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </span>
              </label>
             
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
              aria-label="Create Account"
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <span className={loading ? 'invisible' : 'visible'}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </span>
            </motion.button>
          </div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="relative my-8"
          >
            
          </motion.div>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="text-center mt-8 space-y-4"
          >
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Sign in here
              </Link>
            </p>
            
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;