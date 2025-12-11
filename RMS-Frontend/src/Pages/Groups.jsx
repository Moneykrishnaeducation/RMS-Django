import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "/api/accounts/db/"; // make sure this returns your accounts data

const Groups = () => {
  const [data, setData] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch data every 15 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(API_BASE);
        let accounts = [];
        if (Array.isArray(res.data)) {
          accounts = res.data;
        } else if (res.data.accounts && Array.isArray(res.data.accounts)) {
          accounts = res.data.accounts;
        } else if (res.data.results && Array.isArray(res.data.results)) {
          accounts = res.data.results;
        }
        setData(accounts);
        if (accounts.length && !selectedGroup) {
          setSelectedGroup(accounts[0].group || "");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // 15 sec auto-refresh
    return () => clearInterval(interval);
  }, [selectedGroup]);

  // Unique groups for dropdown
  const groupsList = Array.from(
    new Set(data.map((d) => d.group).filter(Boolean))
  ).sort();

  // Filter data by selected group
  const filteredData = selectedGroup
    ? data.filter((d) => d.group === selectedGroup)
    : [];

  if (loading) return <p className="p-6">Loading...</p>;
  if (!data.length) return <p className="p-6">No data available.</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Groups Overview</h2>

      {/* Group selection */}
      {groupsList.length ? (
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">Select Group:</label>
          <select
            className="p-2 border border-gray-300 rounded-md w-full max-w-sm"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groupsList.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-gray-500 mb-6">No groups available.</p>
      )}

      {/* Group summary */}
      {selectedGroup && (
        <div className="mb-6 bg-white shadow rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 font-medium">Group: <span className="font-semibold">{selectedGroup}</span></p>
          <p className="text-gray-600 font-medium mt-2">Total Accounts: <span className="font-semibold">{filteredData.length}</span></p>
        </div>
      )}

      {/* Data Table */}
      {filteredData.length ? (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full table-auto ">
            <thead className="bg-indigo-600 text-white uppercase ">
              <tr>
                {["Login", "Name", "Profit", "Balance", "Equity"].map((header) => (
                  <th
                    key={header}
                    className="p-3 border-b text-left text-white font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="p-2">{row.login || "-"}</td>
                  <td className="p-2">{row.name || "-"}</td>
                  <td className="p-2">{Number(row.profit || 0).toFixed(2)}</td>
                  <td className="p-2">{Number(row.balance || 0).toFixed(2)}</td>
                  <td className="p-2">{Number(row.equity || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No accounts in this group.</p>
      )}
    </div>
  );
};

export default Groups;
