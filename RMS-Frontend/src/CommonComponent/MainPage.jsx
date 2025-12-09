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
    <div className="section">
      <h2>Account Details</h2>
      <input
        type="number"
        id="login-id"
        placeholder="Enter Login ID"
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
      />
      <button onClick={fetchAccountDetails}>Get Account Details</button>
      <div id="account-details-result" className={`result ${isError ? 'error' : ''}`}>
        {typeof result === 'object' && result !== null ? (
          <ul>
            {Object.entries(result).map(([key, value]) => (
              <li key={key}><strong>{key}:</strong> {value}</li>
            ))}
          </ul>
        ) : (
          result
        )}
      </div>
    </div>
  );
};

export default AccountDetails;
