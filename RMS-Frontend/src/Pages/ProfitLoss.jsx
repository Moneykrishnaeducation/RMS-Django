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

// Make sure the endpoint is correct and includes the trailing slash
const API_BASE = "http://127.0.0.1:8000/api/accounts/db/";

const ProfitLoss = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(API_BASE, {
          headers: { "Content-Type": "application/json" },
        });

        console.log("API Response:", res.data);

        // Adjust this according to your API response structure
        // Example: res.data.accounts or res.data.results or res.data directly
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
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    if (filter === "demo") {
      return data.filter(
        (row) => row.group && row.group.toLowerCase().includes("demo")
      );
    } else if (filter === "real") {
      return data.filter(
        (row) => row.group && !row.group.toLowerCase().includes("demo")
      );
    }
    return data;
  }, [data, filter]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!data.length) return <p className="p-6">No accounts found.</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Profit/Loss Overview
      </h2>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        {["all", "demo", "real"].map((type) => (
          <button
            key={type}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              filter === type
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => setFilter(type)}
          >
            {type === "all"
              ? "All Accounts"
              : type === "demo"
              ? "Demo Account"
              : "Real Account"}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 text-center border border-gray-200">
          <h3 className="text-gray-500 font-medium">Total Accounts</h3>
          <p className="text-2xl font-bold text-gray-800">{filteredData.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center border border-gray-200">
          <h3 className="text-gray-500 font-medium">Min Profit</h3>
          <p className="text-2xl font-bold text-red-500">
            {filteredData.length
              ? Math.min(...filteredData.map((d) => Number(d.profit) || 0)).toFixed(
                  2
                )
              : "0.00"}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center border border-gray-200">
          <h3 className="text-gray-500 font-medium">Max Profit</h3>
          <p className="text-2xl font-bold text-green-500">
            {filteredData.length
              ? Math.max(...filteredData.map((d) => Number(d.profit) || 0)).toFixed(
                  2
                )
              : "0.00"}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center border border-gray-200">
          <h3 className="text-gray-500 font-medium">Negative Profits</h3>
          <p className="text-2xl font-bold text-red-600">
            {filteredData.filter((d) => Number(d.profit) < 0).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg p-4 mb-6 border border-gray-200 overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {["Login", "Name", "Group", "Profit", "Balance", "Equity"].map(
                (header) => (
                  <th
                    key={header}
                    className="p-3 border-b text-left text-gray-600 font-medium"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="p-2 border">{row.login || "-"}</td>
                <td className="p-2 border">{row.name || "-"}</td>
                <td className="p-2 border">{row.group || "-"}</td>
                <td
                  className={`p-2 border ${
                    Number(row.profit) < 0 ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {Number(row.profit || 0).toFixed(2)}
                </td>
                <td className="p-2 border">{Number(row.balance || 0).toFixed(2)}</td>
                <td className="p-2 border">{Number(row.equity || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* P/L Distribution Chart */}
      <div className="bg-white shadow rounded-lg p-4 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">P/L Distribution</h3>
        <div className="w-full h-[400px] min-w-0">
          <ResponsiveContainer>
            <BarChart
              data={filteredData.map((d, i) => ({ idx: i, profit: Number(d.profit || 0) }))}
              margin={{ top: 20, right: 20, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="idx" hide />
              <YAxis />
              <Tooltip formatter={(value) => value.toFixed(2)} />
              <Bar dataKey="profit" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;
