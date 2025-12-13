import React, { useEffect, useState } from "react";
import axios from "axios";

const SymbolPositions = () => {
  const [positions, setPositions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tableData, setTableData] = useState([]);

  const [selectedSymbol, setSelectedSymbol] = useState("XAUUSD");
  const [filter, setFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchLogin, setSearchLogin] = useState("");
  const [searchName, setSearchName] = useState("");

  const [loading, setLoading] = useState(true);
  const [symbols, setSymbols] = useState([]);

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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const posRes = await axios.get("/api/positions/open/");
        const accRes = await axios.get("/api/accounts/db/");

        const posData = posRes.data?.positions || [];
        const accData = accRes.data?.accounts || [];

        setPositions(posData);
        setAccounts(accData);

        // Extract unique symbols
        const uniqueSymbols = Array.from(new Set(posData.map((p) => p.symbol)));
        setSymbols(uniqueSymbols);
      } catch (err) {
        console.error("API Error:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Process and merge data
  useEffect(() => {
    if (!positions.length || !accounts.length || !groups.length) return;

    const filteredAccounts = accounts.filter((a) => groups.includes(a.group));

    let filtered = positions.filter((p) => p.symbol === selectedSymbol);

    filtered =
      filter === "buy"
        ? filtered.filter((p) => p.position_type === "Buy")
        : filter === "sell"
        ? filtered.filter((p) => p.position_type === "Sell")
        : filtered;

    const aggregated = filtered.reduce((acc, p) => {
      const login = p.login__login.toString();
      const vol =
        p.position_type === "Sell" ? -parseFloat(p.volume) : parseFloat(p.volume);

      if (!acc[login]) acc[login] = { netLot: 0 };
      acc[login].netLot += vol;

      return acc;
    }, {});

    const finalData = Object.entries(aggregated).map(([login, info]) => {
      const account = filteredAccounts.find((a) => a.login == login) || {};

      return {
        Login: login,
        Name: account.name || "Unknown",
        Group: account.group || "Unknown",
        BaseSymbol: selectedSymbol,
        NetLot: info.netLot,
        Type: info.netLot > 0 ? "Buy" : info.netLot < 0 ? "Sell" : "-",
        Profit: parseFloat(account.profit) || 0,
      };
    });

    setTableData(finalData);
    setCurrentPage(1);
  }, [positions, accounts, groups, filter, selectedSymbol]);

  // Filtering
  const filteredTable = tableData.filter((item) => {
    const matchLogin = searchLogin ? String(item.Login).includes(searchLogin) : true;
    const matchName = searchName
      ? item.Name.toLowerCase().includes(searchName.toLowerCase())
      : true;
    return matchLogin && matchName;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTable.length / itemsPerPage);
  const paginatedData = filteredTable.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const changePage = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="p-2 md:p-6 bg-gray-50 rounded-xl shadow-xl">
      <h2 className="text-xl md:text-2xl font-bold mb-5 text-gray-800 text-center md:text-left">
        Symbol Positions
      </h2>

      {/* Symbol Select */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-5 items-center">
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="p-2 border border-gray-300 rounded-md w-full max-w-[280px] sm:max-w-sm bg-white text-gray-700 truncate text-sm"
        >
          {symbols.map((sym) => (
            <option key={sym} value={sym}>
              {sym}
            </option>
          ))}
        </select>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 md:gap-3">
          {["all", "buy", "sell"].map((btn) => (
            <button
              key={btn}
              onClick={() => setFilter(btn)}
              className={`px-4 md:px-5 py-2 rounded-lg font-semibold transition-colors duration-300 ${
                filter === btn
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border hover:bg-gray-100"
              }`}
            >
              {btn === "all" ? "All" : btn === "buy" ? "Buy" : "Sell"}
            </button>
          ))}
        </div>
      </div>

      {/* Search Filters */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-5">
        <input
          type="text"
          placeholder="Search Login..."
          className="flex-1 min-w-[150px] md:w-80 px-4 py-2 rounded-xl border border-gray-300 shadow-sm
            focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          value={searchLogin}
          onChange={(e) => {
            setSearchLogin(e.target.value);
            setCurrentPage(1);
          }}
        />

        <input
          type="text"
          placeholder="Search Name..."
          className="flex-1 min-w-[150px] md:w-80 px-4 py-2 rounded-xl border border-gray-300 shadow-sm
            focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500 text-center py-5">Loading...</p>
      ) : paginatedData.length === 0 ? (
        <p className="text-gray-500 text-center py-5">No matching data found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
            <thead className="bg-indigo-600 text-white sticky top-0 z-10 uppercase text-xs md:text-sm">
              <tr>
                {["Login", "Name", "Group", "Base Symbol", "Type", "Net Lot", "USD P&L"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-3 md:px-6 py-2 md:py-3 text-left font-semibold tracking-wider"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 transition duration-200 cursor-pointer"
                >
                  <td className="px-3 md:px-6 py-2 md:py-3">{row.Login}</td>
                  <td className="px-3 md:px-6 py-2 md:py-3">{row.Name}</td>
                  <td className="px-3 md:px-6 py-2 md:py-3">{row.Group}</td>
                  <td className="px-3 md:px-6 py-2 md:py-3">{row.BaseSymbol}</td>
                  <td
                    className={`px-3 md:px-6 py-2 md:py-3 font-semibold ${
                      row.Type === "Buy"
                        ? "text-green-600"
                        : row.Type === "Sell"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {row.Type}
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-3">{row.NetLot.toFixed(2)}</td>
                  <td
                    className={`px-3 md:px-6 py-2 md:py-3 font-semibold ${
                      row.Profit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {parseFloat(row.Profit).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center mt-5 gap-2 md:gap-4 flex-wrap">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 md:px-5 py-2 rounded-lg border bg-white shadow hover:bg-gray-100 disabled:opacity-50 transition-colors duration-300"
        >
          Prev
        </button>

        <span className="font-semibold text-gray-700">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 md:px-5 py-2 rounded-lg border bg-white shadow hover:bg-gray-100 disabled:opacity-50 transition-colors duration-300"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SymbolPositions;
