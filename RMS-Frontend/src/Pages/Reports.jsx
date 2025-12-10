import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000/api/accounts/db";

const Reports = () => {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const res = await axios.get(API_BASE);
      setData(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };


  // Grouping data (group => count, balance_sum, equity_sum)
const groupTable = useMemo(() => {
  const map = {};
  data.forEach((row) => {
    const g = row.group || "Unknown";
    if (!map[g]) map[g] = { group: g, count: 0, balance_sum: 0, equity_sum: 0 };
    map[g].count += 1;
    map[g].balance_sum += Number(row.balance || 0);
    map[g].equity_sum += Number(row.equity || 0);
  });
  return Object.values(map).sort((a, b) => b.count - a.count); // all groups
}, [data]);


  // CSV download
  const downloadCSV = () => {
    if (!data.length) return;
    const header = Object.keys(data[0]).join(",") + "\n";
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "accounts.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6">Reports</h2>

      {/* Group Table */}
      <div className="bg-white shadow rounded-lg p-4 mb-8 border border-gray-200 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-3">Reports</h3>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Group</th>
              <th className="p-2 border">Count</th>
              <th className="p-2 border">Balance (Sum)</th>
              <th className="p-2 border">Equity (Sum)</th>
            </tr>
          </thead>
          <tbody>
            {groupTable.map((g, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2 border">{g.group}</td>
                <td className="p-2 border">{g.count}</td>
                <td className="p-2 border">{g.balance_sum.toFixed(2)}</td>
                <td className="p-2 border">{g.equity_sum.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Group Count Bar Chart */}
      <div className="bg-white shadow rounded-lg p-4 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-3">Group Count Chart</h3>
        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={groupTable} margin={{ top: 20, right: 20, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="group"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CSV Download */}
      <button
        onClick={downloadCSV}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow"
      >
        Download CSV
      </button>
    </div>
  );
};

export default Reports;
