import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api'; // Assuming the Django backend API base

const AccountDetails = () => {
  const [loginId, setLoginId] = useState('');
  const [result, setResult] = useState(null);
  const [isError, setIsError] = useState(false);

  const fetchAccountDetails = async () => {
    if (!loginId) {
      setResult('Please enter a login ID');
      setIsError(true);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/accounts/${loginId}/`);
      if (response.status === 200) {
        setResult(response.data);
        setIsError(false);
      } else {
        setResult(response.data.error || 'Failed to fetch account details');
        setIsError(true);
      }
    } catch (error) {
      setResult(`Error: ${error.message}`);
      setIsError(true);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-900">Account Details</h2>
      <div className="mb-6">
        <input
          type="number"
          id="login-id"
          placeholder="Enter Login ID"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={fetchAccountDetails}
        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
      >
        Get Account Details
      </button>
      <div id="account-details-result" className={`mt-8 ${isError ? 'text-red-600' : 'text-gray-800'}`}>
        {typeof result === 'object' && result !== null ? (
          <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Account Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Login ID:</span>
                <span className="text-gray-800">{result.login}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="text-gray-800">{result.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Email:</span>
                <span className="text-gray-800">{result.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Balance:</span>
                <span className="text-gray-800">${result.balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Equity:</span>
                <span className="text-gray-800">${result.equity}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Margin:</span>
                <span className="text-gray-800">${result.margin}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Free Margin:</span>
                <span className="text-gray-800">${result.margin_free}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Margin Level:</span>
                <span className="text-gray-800">{result.margin_level}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Profit:</span>
                <span className="text-gray-800">${result.profit}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Group:</span>
                <span className="text-gray-800">{result.group}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Leverage:</span>
                <span className="text-gray-800">{result.leverage}:1</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Rights:</span>
                <span className="text-gray-800">{result.rights}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Last Access:</span>
                <span className="text-gray-800">{new Date(result.last_access * 1000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Registration:</span>
                <span className="text-gray-800">{new Date(result.registration * 1000).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600">{result}</p>
        )}
      </div>
    </div>
  );
};

export default AccountDetails;
