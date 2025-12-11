import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // optional icons

const FileManagement = () => {
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // new state

  const handleSubmit = () => {
    if (!password.trim()) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div className="min-h-screen bg-white px-10 py-10">
      {/* PAGE HEADER */}
      <h1 className="text-4xl font-bold text-gray-900 mb-10">File Management</h1>

      {/* LABEL */}
      <label className="block text-gray-700 font-medium mb-2">Password</label>

      {/* INPUT WITH SHOW/HIDE */}
      <div className="relative w-full max-w-lg mb-4">
        <input
          type={showPassword ? "text" : "password"} // toggle input type
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-[100%] py-3 px-4 bg-gray-100 border border-gray-200 rounded-lg
                     focus:ring-2 focus:ring-blue-400 outline-none"
          placeholder="Enter password"
        />

        {/* SHOW/HIDE BUTTON */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3 text-gray-600"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={handleSubmit}
        className="px-6 py-2 border border-gray-300 rounded-lg 
                   hover:bg-gray-100 transition"
      >
        Submit
      </button>

      {/* SUCCESS MESSAGE */}
      {submitted && (
        <div className="mt-4 p-3 bg-blue-300 border border-green-300 rounded-lg text-green-900 w-full max-w-lg">
          ✔ File Management form submitted successfully!
        </div>
      )}
    </div>
  );
};

export default FileManagement;
