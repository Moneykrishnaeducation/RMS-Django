import React, { useState, useMemo, useCallback, useEffect } from "react";
import axios from "axios";

const API_BASE = '/api'; // Django backend API base

const FilterSearch = () => {
  const [data, setData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accountType, setAccountType] = useState("Real Account");
  const [loginFilter, setLoginFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/accounts/db`);
      if (response.data && response.data.accounts) {
        if (Array.isArray(response.data.accounts)) {
          setData(response.data.accounts);
        } else {
          setData(Object.values(response.data.accounts));
        }
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
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

  const isDemo = useCallback((group) => group?.toLowerCase().startsWith("demo"), []);
  const isReal = useCallback((group) => !isDemo(group), [isDemo]);

  const totalReal = data.filter((row) => isReal(row.group)).length;
  const totalDemo = data.filter((row) => isDemo(row.group)).length;

  const filteredRows = useMemo(() => {
    let rows = data.filter(row =>
      accountType === "Real Account" ? isReal(row.group) : isDemo(row.group)
    );

    if (loginFilter.trim() !== "")
      rows = rows.filter(r => String(r.login).toLowerCase().includes(loginFilter.toLowerCase()));

    if (nameFilter.trim() !== "")
      rows = rows.filter(r => r.name.toLowerCase().includes(nameFilter.toLowerCase()));

    if (groupFilter.trim() !== "")
      rows = rows.filter(r => r.group.toLowerCase().includes(groupFilter.toLowerCase()));

    return rows;
  }, [data, accountType, loginFilter, nameFilter, groupFilter, isReal]);

  // Debug logging
  console.log('Account Type:', accountType);
  console.log('Total Real:', totalReal, 'Total Demo:', totalDemo);
  console.log('Sample groups:', data.slice(0, 5).map(row => row.group));
  console.log('Filtered rows count:', filteredRows.length);
  console.log('First 3 filtered groups:', filteredRows.slice(0, 3).map(row => row.group));

  // Reset to page 1 whenever filters change
  useEffect(() => setCurrentPage(1), [accountType, loginFilter, nameFilter, groupFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const paginationNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="p-2 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading filter search data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6 bg-gray-100 min-h-screen">
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          🔍 Advanced Filter Search
        </h2>
      </div>

      <div className="mb-4 text-lg font-semibold text-gray-700">
        <span className="mr-6">Total Real: {totalReal}</span>
        <span>Total Demo: {totalDemo}</span>
      </div>

      {/* Account Type Selector */}
      <div className="mb-6">
        <label className="font-semibold text-gray-800 block mb-2">Select Account Type</label>
        <div className="flex gap-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="accountType"
              value="Real Account"
              checked={accountType === "Real Account"}
              onChange={(e) => setAccountType(e.target.value)}
              className="mr-2"
            />
            Real Account
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="accountType"
              value="Demo Account"
              checked={accountType === "Demo Account"}
              onChange={(e) => setAccountType(e.target.value)}
              className="mr-2"
            />
            Demo Account
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Login Filter */}
        <div className="flex flex-col w-full max-w-full">
          <label className="mb-1 font-medium text-gray-700">Filter by Login</label>
          <input
            type="text"
            className="w-80 p-2 border rounded-lg bg-white"
            placeholder="Search by login..."
            value={loginFilter}
            onChange={(e) => setLoginFilter(e.target.value)}
          />
        </div>

        {/* Name Filter */}
        <div className="flex flex-col w-full max-w-full">
          <label className="mb-1 font-medium text-gray-700">Filter by Name</label>
          <input
            type="text"
            className="w-80 p-2 border rounded-lg bg-white"
            placeholder="Search by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>

        {/* Group Filter */}
        <div className="flex flex-col w-full max-w-full">
          <label className="mb-1 font-medium text-gray-700">Filter by Group</label>
          <input
            type="text"
            className="w-80 p-2 border rounded-lg bg-white"
            placeholder="Search by group..."
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      <h4 className="text-xl font-semibold mb-2">{accountType} - Results</h4>
      <p className="mb-4 font-medium text-gray-700">
        {filteredRows.length} Accounts Found
      </p>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-indigo-600 text-white uppercase">
            <tr>
              <th className="p-3 text-left">Login</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Group</th>
              <th className="p-3 text-left">Leverage</th>
              <th className="p-3 text-left">Balance</th>
              <th className="p-3 text-left">Equity</th>
              <th className="p-3 text-left">Profit</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-200 hover:bg-gray-100 transition">
                <td className="p-3">{row.login}</td>
                <td className="p-3">{row.name}</td>
                <td className="p-3">{row.email}</td>
                <td className="p-3">{row.group}</td>
                <td className="p-3">{row.leverage}</td>
                <td className="p-3">{row.balance}</td>
                <td className="p-3">{row.equity}</td>
                <td className="p-3">{row.profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
  <button
    onClick={() => handlePageChange(currentPage - 1)}
    disabled={currentPage === 1}
    className="px-3 py-1 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50"
  >
    Prev
  </button>

  <select
    className="border px-2 py-1 rounded-md w-24 truncate text-center" // mobile-friendly fixed width
    value={currentPage}
    onChange={(e) => handlePageChange(Number(e.target.value))}
  >
    {Array.from({ length: totalPages }, (_, i) => (
      <option key={i + 1} value={i + 1}>
        {i + 1}
      </option>
    ))}
  </select>

  <button
    onClick={() => handlePageChange(currentPage + 1)}
    disabled={currentPage === totalPages}
    className="px-3 py-1 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50"
  >
    Next
  </button>
</div>

      </div>
    </div>
  );
};

export default FilterSearch;
