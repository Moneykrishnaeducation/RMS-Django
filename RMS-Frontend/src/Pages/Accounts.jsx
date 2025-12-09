// Accounts.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const API_BASE = 'http://127.0.0.1:8000/api'; // Django backend API base

// Reusable Table Component
const Table = ({ columns, data }) => {
  return (
    <table className="min-w-full border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          {columns.map((col) => (
            <th key={col} className="border px-4 py-2 text-left">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="hover:bg-gray-50">
            {columns.map((col) => (
              <td key={col} className="border px-4 py-2">{row[col.toLowerCase()]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default function Accounts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/accounts/db`);
        if (response.data && response.data.accounts) {
          if (Array.isArray(response.data.accounts)) {
            setData(response.data.accounts);
          } else if (typeof response.data.accounts === 'object') {
            setData(Object.values(response.data.accounts));
          } else {
            console.error('accounts is not array or object');
            setData([]);
          }
        } else {
          console.error('API returned invalid data');
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const isDemo = (g) => g?.toLowerCase().startsWith("demo");
  const isReal = (g) => !isDemo(g);

  const exploreAccounts = useMemo(() => data.slice(0, 50), [data]); // Show first 50 as explore
  const topAccounts = useMemo(() =>
    data.sort((a, b) => b.equity - a.equity).slice(0, 10), [data]
  );
  const lowestBalance = useMemo(() =>
    data.filter(r => isReal(r.group)).sort((a, b) => a.balance - b.balance).slice(0, 10), [data]
  );

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-10">
      {/* Explore Accounts Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Explore Accounts</h2>
        <div className="mb-4 space-x-2">
          <button className="px-4 py-2 bg-gray-200 rounded">Demo Account</button>
          <button className="px-4 py-2 bg-gray-200 rounded">Real Account</button>
        </div>
        <p className="mb-2">{exploreAccounts.length} accounts matching filters</p>
        <Table
          columns={["login", "name", "email", "group", "leverage", "balance", "equity", "profit"]}
          data={exploreAccounts}
        />
      </div>

      {/* Top Accounts Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Top Accounts</h2>
        <Table columns={["login", "name", "group", "equity"]} data={topAccounts} />
      </div>

      {/* Lowest Balance Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Lowest Balance</h2>
        <Table columns={["login", "name", "group", "balance"]} data={lowestBalance} />
      </div>
    </div>
  );
}
