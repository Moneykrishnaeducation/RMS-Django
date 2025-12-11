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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(API_BASE);

        const rows =
          res.data.accounts ||
          res.data.positions ||
          res.data ||
          [];

        setData(rows);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
  }, []);

  // Grouped summary
  const groupTable = useMemo(() => {
    const map = {};
    data.forEach((row) => {
      const g = row.group || "Unknown";
      if (!map[g]) map[g] = { group: g, count: 0, balance_sum: 0, equity_sum: 0 };
      map[g].count++;
      map[g].balance_sum += Number(row.balance || 0);
      map[g].equity_sum += Number(row.equity || 0);
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [data]);

  // CSV Export
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800">📊 Reports Dashboard</h1>
        <p className="text-gray-600 mt-1">Group statistics & account insights</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Summary Cards */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Total Accounts</p>
          <p className="text-3xl font-semibold text-gray-800 mt-1">{data.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Total Groups</p>
          <p className="text-3xl font-semibold text-gray-800 mt-1">{groupTable.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Largest Group</p>
          <p className="text-3xl font-semibold text-gray-800 mt-1">
            {groupTable[0]?.group || "—"}
          </p>
        </div>
      </div>

      {/* Group Table */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📁 Group Report Summary</h2>

        <div className="overflow-x-auto rounded-lg">
          <table className="w-full border-collapse text-md">
            <thead>
              <tr className="bg-indigo-600 text-white  tracking-wider">
                <th className="p-3">Group</th>
                <th className="p-3">Count</th>
                <th className="p-3">Balance (Sum)</th>
                <th className="p-3">Equity (Sum)</th>
              </tr>
            </thead>
            <tbody>
              {groupTable.map((g, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3 font-medium">{g.group}</td>
                  <td className="p-3 text-center">{g.count}</td>
                  <td className="p-3 text-blue-600 font-semibold">
                    {g.balance_sum.toFixed(2)}
                  </td>
                  <td className="p-3 text-green-600 font-semibold">
                    {g.equity_sum.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">📈 Group Count Chart</h2>

        <div className="w-full h-[400px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={groupTable}
              margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
            >
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
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Download Button */}
      <div className="text-right mt-4">
        <button
          onClick={downloadCSV}
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-3 rounded-lg font-medium shadow-md"
        >
          ⬇️ Download CSV
        </button>
      </div>

    </div>
  );
};

export default Reports;
