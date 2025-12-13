import React, { useEffect, useState } from "react";
import axios from "axios";
import Loading from "../CommonComponent/Loading";

const API_BASE = "/api/accounts/db/"; // make sure this returns your accounts data

const Groups = () => {
  const [data, setData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch groups data
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get('/api/groups/db/');
        setGroups(res.data.groups || []);
      } catch (err) {
        console.error("Fetch groups error:", err);
      }
    };

    fetchGroups();
  }, []);

  // Set default selectedGroup from groups
  useEffect(() => {
    if (groups.length && !selectedGroup) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);

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
      } catch (err) {
        console.error("Fetch error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Unique groups for dropdown
  const groupsList = groups.sort();

  // Filter by group
  const filteredData = selectedGroup
    ? data.filter((d) => groups.includes(d.group) && d.group === selectedGroup)
    : [];

  if (loading) return <Loading message="Loading groups data..." />;
  if (!data.length) return <p className="p-6">No data available.</p>;

  return (
    <div className="p-2 sm:p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 text-center sm:text-left">
        Groups Overview
      </h2>

      {/* Group selection */}
      {groupsList.length ? (
        <div className="mb-4">
  <label className="block mb-1 text-gray-700 text-sm">
    Select Group:
  </label>
  <select
    className="p-2 border border-gray-300 rounded-md w-full max-w-[280px] sm:max-w-sm bg-white text-gray-700 truncate text-sm"
    value={selectedGroup}
    onChange={(e) => setSelectedGroup(e.target.value)}
  >
    {groupsList.map((group) => (
      <option key={group} value={group} title={group}>
        {group.length > 20 ? `${group.substring(0, 20)}...` : group}
      </option>
    ))}
  </select>
</div>

      ) : (
        <p className="text-gray-500 mb-6">No groups available.</p>
      )}

      {/* Group summary */}
      {selectedGroup && (
        <div className="mb-6 bg-white shadow rounded-lg p-4 border border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Group: <span className="font-semibold">{selectedGroup}</span>
          </p>
          <p className="text-gray-600 font-medium mt-1 sm:mt-0 text-sm sm:text-base">
            Total Accounts: <span className="font-semibold">{filteredData.length}</span>
          </p>
        </div>
      )}

      {/* Data Table */}
      {filteredData.length ? (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-[500px] sm:min-w-[650px] w-full table-auto text-sm">
            <thead className="bg-indigo-600 text-white uppercase text-xs sm:text-sm">
              <tr>
                {["Login", "Name", "Profit", "Balance", "Equity"].map(
                  (header) => (
                    <th
                      key={header}
                      className="p-3 border-b text-left font-medium whitespace-nowrap"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {filteredData.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-2 whitespace-nowrap">{row.login || "-"}</td>
                  <td className="p-2 whitespace-nowrap">{row.name || "-"}</td>
                  <td className="p-2 whitespace-nowrap">
                    {Number(row.profit || 0).toFixed(2)}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {Number(row.balance || 0).toFixed(2)}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {Number(row.equity || 0).toFixed(2)}
                  </td>
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
