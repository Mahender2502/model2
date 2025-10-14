import React, { useState } from 'react';

const PasswordToggle = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-gray-700 mb-1">Password</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          className="absolute right-3 top-2 text-gray-500"
          onClick={() => setShow(!show)}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
};

export default PasswordToggle;
