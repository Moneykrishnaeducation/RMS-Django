import React, { useState, useMemo } from "react";

const FilterSearch = ({ data }) => {
  const [accountType, setAccountType] = useState("Real Account");
  const [loginFilter, setLoginFilter] = useState("All");
  const [nameFilter, setNameFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");

  const isDemo = (group) => group?.toLowerCase().startsWith("demo");
  const isReal = (group) => !isDemo(group);

  const totalReal = data.filter((row) => isReal(row.group)).length;
  const totalDemo = data.filter((row) => isDemo(row.group)).length;

  const filteredRows = useMemo(() => {
    let rows = data.filter(row =>
      accountType === "Real Account" ? isReal(row.group) : isDemo(row.group)
    );

    if (loginFilter !== "All") rows = rows.filter(r => r.login === loginFilter);
    if (nameFilter !== "All") rows = rows.filter(r => r.name === nameFilter);
    if (groupFilter !== "All") rows = rows.filter(r => r.group === groupFilter);

    return rows;
  }, [data, accountType, loginFilter, nameFilter, groupFilter]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        🔍 Advanced Filter Search
      </h2>

      <div className="mb-4 text-lg font-semibold text-gray-700">
        <span className="mr-6">Total Real: {totalReal}</span>
        <span>Total Demo: {totalDemo}</span>
      </div>

      {/* Account Type Selector */}
      <div className="mb-6">
        <label className="font-semibold text-gray-800 block mb-2">Select Account Type</label>

        <div className="flex gap-6">
          {["Real Account", "Demo Account"].map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer text-gray-700">
              <input
                type="radio"
                className="accent-indigo-600"
                checked={accountType === type}
                onChange={() => setAccountType(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Login Filter */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">Filter by Login</label>
          <select
            className="w-full p-2 border rounded-lg bg-white focus:ring focus:ring-indigo-300"
            value={loginFilter}
            onChange={(e) => setLoginFilter(e.target.value)}
          >
            <option>All</option>
            {Array.from(new Set(data.map(i => i.login))).map((login, idx) =>
              <option key={idx}>{login}</option>
            )}
          </select>
        </div>

        {/* Name Filter */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">Filter by Name</label>
          <select
            className="w-full p-2 border rounded-lg bg-white focus:ring focus:ring-indigo-300"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          >
            <option>All</option>
            {Array.from(new Set(data.map(i => i.name))).map((name, idx) =>
              <option key={idx}>{name}</option>
            )}
          </select>
        </div>

        {/* Group Filter */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">Filter by Group</label>
          <select
            className="w-full p-2 border rounded-lg bg-white focus:ring focus:ring-indigo-300"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option>All</option>
            {Array.from(new Set(data.map(i => i.group))).map((grp, idx) =>
              <option key={idx}>{grp}</option>
            )}
          </select>
        </div>
      </div>

      {/* Results */}
      <h4 className="text-xl font-semibold mb-2">{accountType} - Results</h4>
      <p className="mb-4 font-medium text-gray-700">
        {filteredRows.length} Accounts Found
      </p>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-indigo-700 text-white">
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
            {filteredRows.map((row, i) => (
              <tr key={i} className="border-b hover:bg-gray-100 transition">
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

    </div>
  );
};

export default FilterSearch