import React, { useEffect, useState } from "react";
import axios from "axios";

const OpenPosition = () => {
  const [positions, setPositions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [mergedData, setMergedData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [positionsPerPage] = useState(10);

  const [searchLogin, setSearchLogin] = useState("");
  const [searchName, setSearchName] = useState("");

  // -------------------------
  // FETCH BOTH APIs
  // -------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const posRes = await axios.get("/api/positions/open");
        const accRes = await axios.get("/api/accounts/db");

        setPositions(posRes.data.positions);
        setAccounts(accRes.data.accounts);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // -------------------------
  // MERGE DATA BY LOGIN
  // -------------------------
  useEffect(() => {
    if (positions.length && accounts.length) {
      const accMap = {};

      accounts.forEach((acc) => {
        accMap[acc.login] = acc;
      });

      const finalMerge = positions.map((p) => ({
        ...p,
        name: accMap[p.login__login]?.name || "-",
        group: accMap[p.login__login]?.group || "-",
      }));

      setMergedData(finalMerge);
    }
  }, [positions, accounts]);

  // -------------------------
  // FILTERING (Login + Name)
  // -------------------------
  const filteredData = mergedData.filter((p) => {
    const matchLogin = searchLogin
      ? String(p.login__login).includes(searchLogin)
      : true;

    const matchName = searchName
      ? p.name.toLowerCase().includes(searchName.toLowerCase())
      : true;

    return matchLogin && matchName;
  });

  // -------------------------
  // PAGINATION
  // -------------------------
  const totalPages = Math.ceil(filteredData.length / positionsPerPage);
  const indexOfLast = currentPage * positionsPerPage;
  const indexOfFirst = indexOfLast - positionsPerPage;
  const currentPositions = filteredData.slice(indexOfFirst, indexOfLast);

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
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // -------------------------
  // SUMMARY
  // -------------------------
  const totalPositions = filteredData.length;
  const topProfit = filteredData.length
    ? Math.max(...filteredData.map((p) => Number(p.profit)))
    : 0;

  const topLoss = filteredData.length
    ? Math.min(...filteredData.map((p) => Number(p.profit)))
    : 0;

  const totalSymbols = [...new Set(filteredData.map((p) => p.symbol))].length;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Open Positions
      </h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search Login..."
          className="border px-3 py-2 rounded w-full sm:w-48"
          value={searchLogin}
          onChange={(e) => {
            setSearchLogin(e.target.value);
            setCurrentPage(1);
          }}
        />

        <input
          type="text"
          placeholder="Search Name..."
          className="border px-3 py-2 rounded w-full sm:w-64"
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4 shadow flex flex-col items-center">
          <span className="text-gray-500 text-sm">Total Positions</span>
          <span className="text-xl font-bold text-blue-600">{totalPositions}</span>
        </div>
        <div className="bg-green-50 rounded-lg p-4 shadow flex flex-col items-center">
          <span className="text-gray-500 text-sm">Top Profit</span>
          <span className="text-xl font-bold text-green-600">{topProfit}</span>
        </div>
        <div className="bg-red-50 rounded-lg p-4 shadow flex flex-col items-center">
          <span className="text-gray-500 text-sm">Top Loss</span>
          <span className="text-xl font-bold text-red-600">{topLoss}</span>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 shadow flex flex-col items-center">
          <span className="text-gray-500 text-sm">Total Symbols</span>
          <span className="text-xl font-bold text-yellow-600">{totalSymbols}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-700 text-white uppercase text-sm">
            <tr>
              {["Login", "Name", "Group", "Base Symbol", "Net Lot", "USD P&L"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-7 py-4 text-left"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {currentPositions.map((pos, index) => (
              <tr
                key={index}
                className="hover:bg-gray-100 transition-colors duration-200 text-center"
              >
                <td className="px-6 py-4 whitespace-nowrap">{pos.login__login}</td>
                <td className="px-6 py-4 whitespace-nowrap">{pos.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{pos.group}</td>
                <td className="px-6 py-4 whitespace-nowrap">{pos.symbol}</td>
                <td className="px-6 py-4 whitespace-nowrap">{pos.volume}</td>

                <td
                  className={`px-6 py-4 whitespace-nowrap font-medium ${
                    parseFloat(pos.profit) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {pos.profit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="flex space-x-1">
          {paginationNumbers().map((page, idx) =>
            page === "..." ? (
              <span key={idx} className="px-3 py-1 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md border ${
                  currentPage === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <select
          className="border px-2 py-1 rounded-md"
          value={currentPage}
          onChange={(e) => handlePageChange(Number(e.target.value))}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Page {i + 1}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default OpenPosition;
