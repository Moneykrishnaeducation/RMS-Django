import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const OPEN_API = "/api/positions/open/";
const CLOSED_API = "/api/positions/closed/";

const MatrixProfit = () => {
  const [matrix, setMatrix] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [totalRow, setTotalRow] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchLogin, setSearchLogin] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    loadProfitMatrix();
  }, []);

  const loadProfitMatrix = async () => {
    try {
      const openRes = await axios.get(OPEN_API);
      const closedRes = await axios.get(CLOSED_API);

      const open = openRes.data.positions;
      const closed = closedRes.data.closed_positions;

      const uniqueLogins = [
        ...new Set([
          ...open.map((x) => x.login__login),
          ...closed.map((x) => x.login__login),
        ]),
      ];

      const uniqueSymbols = [
        ...new Set([
          ...open.map((x) => x.symbol),
          ...closed.map((x) => x.symbol),
        ]),
      ];

      setSymbols(uniqueSymbols);

      // Build main table rows
      const table = uniqueLogins.map((login) => {
        const row = { login };

        uniqueSymbols.forEach((symbol) => {
          const openProfit = open
            .filter((p) => p.login__login === login && p.symbol === symbol)
            .reduce((a, b) => a + parseFloat(b.profit || 0), 0);

          const closedProfit = closed
            .filter((p) => p.login__login === login && p.symbol === symbol)
            .reduce((a, b) => a + parseFloat(b.profit || 0), 0);

          const totalProfit = openProfit + closedProfit;

          row[symbol] = totalProfit.toFixed(2);
        });

        return row;
      });

      // TOTAL Row
      const total = { login: "TOTAL" };
      uniqueSymbols.forEach((symbol) => {
        const openSum = open
          .filter((p) => p.symbol === symbol)
          .reduce((a, b) => a + parseFloat(b.profit || 0), 0);

        const closedSum = closed
          .filter((p) => p.symbol === symbol)
          .reduce((a, b) => a + parseFloat(b.profit || 0), 0);

        total[symbol] = (openSum + closedSum).toFixed(2);
      });

      setMatrix(table);
      setTotalRow(total);
      setLoading(false);
    } catch (error) {
      console.error("Error loading profit matrix:", error);
      setLoading(false);
    }
  };

  // Search handling
  const filteredMatrix = useMemo(() => {
    return matrix.filter((row) =>
      row.login.toString().toLowerCase().includes(searchLogin.toLowerCase())
    );
  }, [matrix, searchLogin]);

  // Pagination
  const totalPages = Math.ceil(filteredMatrix.length / pageSize);
  const paginated = filteredMatrix.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getHeatColor = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    if (num > 0) return "bg-green-50 text-green-700 font-semibold";
    if (num < 0) return "bg-red-50 text-red-700 font-semibold";
    return "text-gray-700";
  };

  return (
    <div className="p-3 sm:p-5">
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-5 text-center sm:text-left">
        📈 Profit Matrix (Open + Closed Positions)
      </h2>

      {/* SEARCH BAR */}
      <div className="mb-4 w-full flex justify-center sm:justify-start">
        <input
          type="text"
          placeholder="Search login..."
          value={searchLogin}
          onChange={(e) => {
            setSearchLogin(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-80 px-4 py-2 rounded-xl border border-gray-300 shadow-sm
          focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
        />
      </div>

      {loading ? (
        <div className="p-2 bg-gray-100 h-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading filter search data...</p>
        </div>
      </div>
      ) : (
        <div className="rounded-xl border border-gray-200 shadow-xl overflow-hidden bg-white">

          {/* SCROLL WRAPPER */}
          <div className="overflow-auto max-h-[75vh]">
            <table className="min-w-max w-full text-[13px] sm:text-sm border-collapse">
              <thead className="bg-indigo-600 text-white sticky top-0 z-30">
                <tr>
                  <th className="sticky left-0 z-40 bg-indigo-600 px-4 py-2 text-center font-semibold">
                    Login
                  </th>
                  {symbols.map((symbol) => (
                    <th
                      key={symbol}
                      className="px-4 py-2 text-center font-semibold whitespace-nowrap"
                    >
                      {symbol}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>

                {/* TOTAL ROW */}
                <tr className="bg-blue-50 border-b border-gray-300 font-bold">
                  <td className="sticky left-0 bg-blue-50 px-4 py-2 text-center z-20">
                    TOTAL
                  </td>
                  {symbols.map((symbol) => (
                    <td key={symbol} className="px-4 py-2 text-center">
                      {totalRow[symbol]}
                    </td>
                  ))}
                </tr>

                {/* DATA ROWS */}
                {paginated.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                  >
                    <td
                      className="sticky left-0 bg-white px-4 py-2 text-center font-medium border-r border-gray-300 z-10"
                    >
                      {row.login}
                    </td>

                    {symbols.map((symbol) => (
                      <td
                        key={symbol}
                        className={`px-4 py-2 text-center border-b border-gray-200 ${getHeatColor(
                          row[symbol]
                        )}`}
                      >
                        {row[symbol]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION UI */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-100 border-t gap-3">

            <span className="text-sm text-gray-600">
              Page <b>{currentPage}</b> of <b>{totalPages}</b>
            </span>

            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-white border hover:bg-gray-200 disabled:bg-gray-300"
              >
                « First
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-white border hover:bg-gray-200 disabled:bg-gray-300"
              >
                ← Prev
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-white border hover:bg-gray-200 disabled:bg-gray-300"
              >
                Next →
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-white border hover:bg-gray-200 disabled:bg-gray-300"
              >
                Last »
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrixProfit;
