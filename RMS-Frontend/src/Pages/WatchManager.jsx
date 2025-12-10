import React, { useState } from "react";

const WatchManager = () => {
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!password.trim()) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div className="min-h-screen bg-white px-10 py-10">

      {/* SECTION TITLE */}
      
      <h1 className="text-4xl font-bold text-gray-900 mb-10">
        Watch Manager
      </h1>

      

      {/* LABEL */}
      <label className="block text-gray-700 font-medium mb-2">Password</label>

      {/* INPUT FIELD (light gray like Streamlit) */}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-lg
                   focus:ring-2 focus:ring-blue-400 outline-none mb-4"
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
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-900 w-full max-w-lg">
          ✔ Watch Manager form submitted successfully!
        </div>
      )}
    </div>
  );
};

export default WatchManager;
