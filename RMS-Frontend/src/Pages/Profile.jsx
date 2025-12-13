import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = '/api'; // Assuming the Django backend API base

const Profile = () => {
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
      const response = await axios.get(`${API_BASE}/profile/${loginId}/`);
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
                <span className="text-gray-800">{result.account.login}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="text-gray-800">{result.account.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Email:</span>
                <span className="text-gray-800">{result.account.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Balance:</span>
                <span className="text-gray-800">${result.account.balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Equity:</span>
                <span className="text-gray-800">${result.account.equity}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Margin:</span>
                <span className="text-gray-800">${result.account.margin}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Free Margin:</span>
                <span className="text-gray-800">${result.account.margin_free}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Margin Level:</span>
                <span className="text-gray-800">{result.account.margin_level}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Profit:</span>
                <span className="text-gray-800">${result.account.profit}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Group:</span>
                <span className="text-gray-800">{result.account.group}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Leverage:</span>
                <span className="text-gray-800">{result.account.leverage}:1</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Rights:</span>
                <span className="text-gray-800">{result.account.rights}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Last Access:</span>
                <span className="text-gray-800">{result.account.last_access ? new Date(result.account.last_access * 1000).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Registration:</span>
                <span className="text-gray-800">{result.account.registration ? new Date(result.account.registration * 1000).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
            {result.open_positions && result.open_positions.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Open Positions</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-600">Position ID</th>
                        <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-600">Symbol</th>
                        <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-600">Volume</th>
                        <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-600">Price</th>
                        <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-600">Profit</th>
                        <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-600">Type</th>
                        <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-600">Date Created</th>
                        <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-600">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.open_positions.map((pos, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border-b text-sm text-gray-800">{pos.position_id}</td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">{pos.symbol}</td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">{pos.volume}</td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">${pos.price}</td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">${pos.profit}</td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">{pos.position_type}</td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">{new Date(pos.date_created).toLocaleString()}</td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">{new Date(pos.last_updated).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-600">{result}</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
