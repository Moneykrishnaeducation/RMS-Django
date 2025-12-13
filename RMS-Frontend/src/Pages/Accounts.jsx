// Accounts.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Loading from "../CommonComponent/Loading";

const API_BASE = "/api";
 
// Reusable Table Component (modern UI)
const Table = ({ columns, data }) => {
  return (
    <div className="overflow-x-auto shadow-lg rounded-xl ">
      <table className="min-w-full">
        <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 text-left text-sm font-semibold uppercase">
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white">
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-blue-50 transition-all border-b border-gray-200 last:border-none"
            >
              {columns.map((col) => (
                <td key={col} className="px-4 py-3 text-sm text-gray-700">
                  {row[col.toLowerCase()]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Accounts = () => {
  const [data, setData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [accountType, setAccountType] = useState("all"); // all | demo | real
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchAccounts = async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${API_BASE}/accounts/db`);

      if (response.data && response.data.accounts) {
        if (Array.isArray(response.data.accounts)) {
          setData(response.data.accounts);
        } else if (typeof response.data.accounts === "object") {
          setData(Object.values(response.data.accounts));
        }
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API_BASE}/groups/db/`);
      if (response.data && response.data.groups) {
        if (Array.isArray(response.data.groups)) {
          setGroups(response.data.groups);
        } else if (typeof response.data.groups === 'object') {
          setGroups(Object.values(response.data.groups));
        } else {
          console.error('groups is not array or object');
          setGroups([]);
        }
      } else {
        console.error('API returned invalid groups data');
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // First sync MT5 to DB (includes groups and accounts)
      await axios.get(`${API_BASE}/sync/mt5/`);
      // Then refresh groups and accounts data
      await Promise.all([fetchGroups(), fetchAccounts()]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchGroups(), fetchAccounts()]);
    };
    fetchData();
  }, []);

  const isDemo = (g) => g?.toLowerCase().startsWith("demo");
  const isReal = (g) => !isDemo(g);

  const exploreFiltered = useMemo(() => {
    if (accountType === "demo") return data.filter((a) => isDemo(a.group));
    if (accountType === "real") return data.filter((a) => isReal(a.group));
    return data;
  }, [data, accountType]);

  const totalPages = useMemo(
    () => Math.ceil(exploreFiltered.length / pageSize),
    [exploreFiltered]
  );

  const exploreAccounts = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return exploreFiltered.slice(start, end);
  }, [exploreFiltered, page]);

  const topAccounts = useMemo(
    () => [...data].sort((a, b) => b.equity - a.equity).slice(0, 10),
    [data]
  );

  const lowestBalance = useMemo(
    () =>
      data
        .filter((r) => isReal(r.group))
        .sort((a, b) => a.balance - b.balance)
        .slice(0, 10),
    [data]
  );

  if (loading) return <Loading message="Loading accounts data..." />;

  return (
    <div className="p-2 space-y-12 bg-gray-50 min-h-screen">
      {/* SECTION 1 — Explore Accounts */}
      <div className=" md:p-4 rounded-2xl shadow-xl border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Explore Accounts
        </h2>

        {/* FILTER BUTTONS */}
        <div className="flex flex-wrap md:flex-nowrap gap-3 mx-4 mb-6">
          {["demo", "real", "all"].map((type) => (
            <button
              key={type}
              onClick={() => {
                setAccountType(type);
                setPage(1);
              }}
              className={`px-6 py-2 w-100  rounded-full text-sm font-medium shadow transition-all 
                ${
                  accountType === type
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-300"
                }`}
            >
              {type === "demo"
                ? "Demo Accounts"
                : type === "real"
                ? "Real Accounts"
                : "All"}
            </button>
          ))}
        </div>

        <p className="text-gray-600 mb-4">
          Showing <strong>{exploreFiltered.length}</strong> accounts
        </p>

        <Table
          columns={[
            "login",
            "name",
            "email",
            "group",
            "leverage",
            "balance",
            "equity",
            "profit",
          ]}
          data={exploreAccounts}
        />

        {/* PAGINATION */}
        <div className="flex justify-center items-center space-x-3 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-4 py-2 rounded-lg text-sm shadow ${
              page === 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            ← Prev
          </button>

          <span className="px-4 py-2 text-gray-700 font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={`px-4 py-2 rounded-lg text-sm shadow ${
              page === totalPages
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Next →
          </button>
        </div>
      </div>

      {/* SECTION 2 — Top Accounts */}
      <div className="md:p-8 rounded-2xl shadow-xl ">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Accounts</h2>
        <Table
          columns={["login", "name", "group", "equity"]}
          data={topAccounts}
        />
      </div>

      {/* SECTION 3 — Lowest Balance */}
      <div className=" md:p-8 rounded-2xl shadow-xl ">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Lowest Balance</h2>
        <Table
          columns={["login", "name", "group", "balance"]}
          data={lowestBalance}
        />
      </div>
    </div>
  );
};

export default Accounts;
