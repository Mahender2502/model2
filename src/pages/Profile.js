
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { logout } = useAuth();

  // API base URL - adjust this to match your backend URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Get auth token from localStorage
  const getAuthToken = () => localStorage.getItem('token');

  // Fetch user profile from MongoDB
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = getAuthToken();

      if (!token) {
        setError('No authentication token found. Please log in again.');
        setIsLoading(false);
        return;
      }

      console.log('Fetching user profile from:', `${API_BASE_URL}/auth/profile`);

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);

        // Check if response is HTML (error page) instead of JSON
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          throw new Error('Server returned HTML instead of JSON. Make sure the backend server is running and the endpoint exists.');
        }

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}...`);
        }

        throw new Error(errorData.message || 'Failed to fetch user profile');
      }

      const userData = await response.json();
      console.log('User profile data received:', userData);

      // Transform the data to match the expected format
      const transformedUserData = {
        username: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        mobileNumber: userData.mobileNumber,
        avatar: '👤',
        joinDate: new Date(userData.createdAt).toLocaleDateString(),
        userType: userData.userType,
        totalChats: userData.totalChats || 0,
        firstName: userData.firstName,
        lastName: userData.lastName,
        createdAt: userData.createdAt
      };

      console.log('Transformed user data:', transformedUserData);

      setUserInfo(transformedUserData);
      setEditForm(transformedUserData);
    } catch (err) {
      console.error('Error fetching user profile:', err);

      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      } else {
        setError(err.message || 'Failed to load user profile');
      }

      // Fallback to static data if API fails
      const fallbackData = {
        username: 'ChatBot User',
        email: 'user@chatbot.com',
        avatar: '👤',
        joinDate: new Date().toLocaleDateString(),
        totalChats: 0,
      };
      setUserInfo(fallbackData);
      setEditForm(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Debug: Log userInfo changes
  useEffect(() => {
    console.log('UserInfo updated:', userInfo);
    console.log('Total chats:', userInfo?.totalChats);
  }, [userInfo]);

  const handleSave = async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const updateData = {
        firstName: editForm.firstName || editForm.username.split(' ')[0],
        lastName: editForm.lastName || editForm.username.split(' ')[1] || '',
        email: editForm.email,
        mobileNumber: editForm.mobileNumber,
      };

      console.log('Updating profile with data:', updateData);

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error response:', errorText);

        // Check if response is HTML instead of JSON
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          throw new Error('Server returned HTML instead of JSON. Make sure the backend server is running.');
        }

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}...`);
        }

        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedUserData = await response.json();
      console.log('Profile updated successfully:', updatedUserData);

      // Transform and set the updated data
      const transformedData = {
        ...editForm,
        username: `${updatedUserData.firstName} ${updatedUserData.lastName}`,
        firstName: updatedUserData.firstName,
        lastName: updatedUserData.lastName,
        email: updatedUserData.email,
        mobileNumber: updatedUserData.mobileNumber,
      };

      setUserInfo(transformedData);
      setIsEditing(false);
      setError('');
    } catch (err) {
      console.error('Error updating profile:', err);

      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      } else {
        setError(err.message || 'Failed to update profile');
      }
    }
  };

  const handleCancel = () => {
    setEditForm(userInfo);
    setIsEditing(false);
    setError('');
  };


  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Loading Profile</h2>
          <p className="text-gray-600 dark:text-gray-400">Fetching your profile information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !userInfo) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Profile</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchUserProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Your Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Manage your account settings and preferences
          </p>
        </motion.div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="mr-3">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 text-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="text-6xl mb-4"
              >
                {userInfo.avatar}
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {userInfo.username}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {userInfo.email}
              </p>
              {userInfo.mobileNumber && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  📱 {userInfo.mobileNumber}
                </p>
              )}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Member since {userInfo.joinDate}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    logout();
                    window.location.href = '/home';
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🚪</span>
                    Logout
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>


          {/* Profile Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-primary"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </motion.button>
              </div>

              {!isEditing ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username
                    </label>
                    <p className="text-lg text-gray-900 dark:text-white">{userInfo.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-lg text-gray-900 dark:text-white">{userInfo.email}</p>
                  </div>
                  {userInfo.mobileNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mobile Number
                      </label>
                      <p className="text-lg text-gray-900 dark:text-white">{userInfo.mobileNumber}</p>
                    </div>
                  )}
                  {userInfo.userType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        User Type
                      </label>
                      <p className="text-lg text-gray-900 dark:text-white capitalize">{userInfo.userType.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName || editForm.username?.split(' ')[0] || ''}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName || editForm.username?.split(' ')[1] || ''}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.mobileNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSave}
                      className="btn-primary"
                    >
                      Save Changes
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCancel}
                      className="btn-secondary"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12"
        >
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Your Activity
          </h3>
          <div className="flex justify-center">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full">
              {[
                { label: 'Total Chats', value: userInfo?.totalChats || 0, icon: '💬' },
                { label: 'Days Active', value: Math.floor((new Date() - new Date(userInfo?.createdAt)) / (1000 * 60 * 60 * 24)) || 1, icon: '📅' }
              ].map((stat, index) => {
                console.log(`Stat ${index}:`, stat); // Debug each stat
                return (
                  <motion.div
                    key={index}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 text-center shadow-lg min-w-0 flex-1"
                  >
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">
                      {stat.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
