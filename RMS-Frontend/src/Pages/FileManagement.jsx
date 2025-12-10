import React, { useState } from "react";

const FileManagement = () => {
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!password.trim()) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div className="min-h-screen bg-white px-10 py-10">

      {/* PAGE HEADER */}
      <h1 className="text-4xl font-bold text-gray-900 mb-10">
        File Management
      </h1>

      {/* SECTION TITLE */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        
      </h2>

      {/* LABEL */}
      <label className="block text-gray-700 font-medium mb-2">Password</label>

      {/* STREAMLIT-LIKE INPUT */}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-lg
                   focus:ring-2 focus:ring-blue-400 outline-none mb-4"
        placeholder="Enter password"
      />

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
