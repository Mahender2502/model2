import React from 'react';
import { motion } from 'framer-motion';

const InputField = ({ label, type, value, onChange, placeholder, name }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="mb-4"
  >
    <label className="block text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </motion.div>
);

export default InputField;
