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

const API_BASE = "/api/accounts/db/";

const ProfitLoss = () => {
  const [data, setData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Fetch accounts data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(API_BASE, {
          headers: { "Content-Type": "application/json" },
        });

        let accounts = [];
        if (Array.isArray(res.data)) accounts = res.data;
        else if (res.data.accounts) accounts = res.data.accounts;
        else if (res.data.results) accounts = res.data.results;

        setData(accounts);
      } catch (err) {
        console.error("Fetch accounts error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    // First, filter accounts to only those whose group exists in the Groups table
    let filtered = data.filter((row) => groups.includes(row.group));
    // Then apply demo/real filter
    if (filter === "demo") {
      filtered = filtered.filter(
        (row) => row.group && row.group.toLowerCase().includes("demo")
      );
    } else if (filter === "real") {
      filtered = filtered.filter(
        (row) => row.group && !row.group.toLowerCase().includes("demo")
      );
    }
    return filtered;
  }, [data, filter, groups]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  if (loading) return <p className="p-6 text-center">Loading...</p>;
  if (!data.length) return <p className="p-6 text-center">No accounts found.</p>;

  return (
    <div className="p-2 sm:p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 text-center sm:text-left">
        Profit/Loss Overview
      </h2>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap gap-3 mb-6 justify-center sm:justify-start">
        {["all", "demo", "real"].map((type) => (
          <button
            key={type}
            className={`px-4 py-2 text-sm rounded-full font-semibold transition ${
              filter === type
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => {
              setFilter(type);
              setCurrentPage(1);
            }}
          >
            {type === "all"
              ? "All Accounts"
              : type === "demo"
              ? "Demo Accounts"
              : "Real Accounts"}
          </button>
        ))}
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            title: "Total Accounts",
            value: filteredData.length,
            color: "text-gray-800",
          },
          {
            title: "Min Profit",
            value: filteredData.length
              ? Math.min(...filteredData.map((d) => Number(d.profit) || 0)).toFixed(2)
              : "0.00",
            color: "text-red-500",
          },
          {
            title: "Max Profit",
            value: filteredData.length
              ? Math.max(...filteredData.map((d) => Number(d.profit) || 0)).toFixed(2)
              : "0.00",
            color: "text-green-500",
          },
          {
            title: "Negative Profits",
            value: filteredData.filter((d) => Number(d.profit) < 0).length,
            color: "text-red-600",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white shadow rounded-lg p-3 text-center border border-gray-200"
          >
            <h3 className="text-sm text-gray-500 font-medium">{card.title}</h3>
            <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded-lg mb-6 border border-gray-200 overflow-x-auto">
        <table className="min-w-[750px] w-full table-auto border-collapse">
          <thead className="bg-indigo-600 text-white uppercase text-xs sm:text-sm">
            <tr>
              {["Login", "Name", "Group", "Profit", "Balance", "Equity"].map(
                (header) => (
                  <th key={header} className="p-3 border-b text-left">
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <td className="p-2 text-sm">{row.login || "-"}</td>
                <td className="p-2 text-sm">{row.name || "-"}</td>
                <td className="p-2 text-sm">{row.group || "-"}</td>

                <td
                  className={`p-2 text-sm ${
                    Number(row.profit) < 0 ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {Number(row.profit || 0).toFixed(2)}
                </td>

                <td className="p-2 text-sm">
                  {Number(row.balance || 0).toFixed(2)}
                </td>

                <td className="p-2 text-sm">
                  {Number(row.equity || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-center items-center gap-3 py-4">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          <span className="text-sm font-medium">
            Page {currentPage} / {totalPages}
          </span>

          <button
            className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700 text-center sm:text-left">
          P/L Distribution
        </h3>

        {/* Mobile scroll wrapper */}
        <div className="overflow-x-auto sm:overflow-visible">
          <div className="min-w-[520px] sm:min-w-0 h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData.map((d, i) => ({
                  idx: i,
                  profit: Number(d.profit || 0),
                }))}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
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
    </div>
  );
};

export default ProfitLoss;
