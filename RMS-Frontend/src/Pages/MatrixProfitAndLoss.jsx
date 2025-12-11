import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const LOT_API = "http://127.0.0.1:8000/api/lots/all/";
const PROFIT_API = "http://127.0.0.1:8000/api/positions/open/";

const MatrixProfitAndLoss = () => {
  const [matrix, setMatrix] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [totalRow, setTotalRow] = useState({});
  const [loading, setLoading] = useState(true);

  // Search
  const [searchLogin, setSearchLogin] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      const lotRes = await axios.get(LOT_API);
      const profitRes = await axios.get(PROFIT_API);

      const lots = lotRes.data.data;
      const profits = profitRes.data.positions;

      const uniqueLogins = [...new Set(lots.map(i => i.login_id))];
      const uniqueSymbols = [...new Set(lots.map(i => i.symbol))];

      setSymbols(uniqueSymbols);

      const table = uniqueLogins.map(login => {
        const row = { login };

        uniqueSymbols.forEach(symbol => {
          // LOT
          const lotItem = lots.find(
            x => x.login_id === login && x.symbol === symbol
          );
          const lot = lotItem ? parseFloat(lotItem.lot).toFixed(2) : "";

          // PROFIT (sum all open positions for same login + symbol)
          const profitSum = profits
            .filter(
              p =>
                p.login__login === login &&
                p.symbol === symbol &&
                p.profit !== undefined
            )
            .reduce((a, b) => a + parseFloat(b.profit), 0);

          const profit =
            profitSum !== 0 ? profitSum.toFixed(2) : profitSum === 0 ? "0.00" : "";

          // Alternating Cells  
          // Even index → LOT  
          // Odd index → PROFIT  
          const symbolIndex = uniqueSymbols.indexOf(symbol);

          row[symbol] = symbolIndex % 2 === 0 ? lot : profit;
        });

        return row;
      });

      // TOTAL ROW
      const total = { login: "All Login" };
      uniqueSymbols.forEach(symbol => {
        const idx = uniqueSymbols.indexOf(symbol);

        if (idx % 2 === 0) {
          const sumLots = lots
            .filter(x => x.symbol === symbol)
            .reduce((a, b) => a + parseFloat(b.lot), 0);

          total[symbol] = sumLots.toFixed(2);
        } else {
          const sumProfits = profits
            .filter(p => p.symbol === symbol)
            .reduce((a, b) => a + parseFloat(b.profit), 0);

          total[symbol] = sumProfits.toFixed(2);
        }
      });

      setTotalRow(total);
      setMatrix(table);
      setLoading(false);
    } catch (err) {
      console.error("Error loading:", err);
      setLoading(false);
    }
  };

  // SEARCH FILTER
  const filteredMatrix = useMemo(() => {
    return matrix.filter(row =>
      row.login.toString().toLowerCase().includes(searchLogin.toLowerCase())
    );
  }, [matrix, searchLogin]);

  const totalPages = Math.ceil(filteredMatrix.length / pageSize);

  const paginated = filteredMatrix.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getHeatColor = (value) => {
    if (!value || isNaN(value)) return "";
    const num = parseFloat(value);
    if (num > 0) return "bg-green-50 text-green-700 font-semibold";
    if (num < 0) return "bg-red-50 text-red-700 font-semibold";
    return "text-gray-700";
  };

  return (
    <div className="p-8">

      <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-3">
        <span>💹</span>
        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Login vs Symbol Matrix – Alternate LOT / PROFIT
        </span>
      </h2>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Login..."
          value={searchLogin}
          onChange={(e) => {
            setSearchLogin(e.target.value);
            setCurrentPage(1);
          }}
          className="w-80 px-4 py-2 rounded-xl border border-gray-300 shadow-sm
            focus:ring-2 focus:ring-green-400 focus:outline-none transition"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-lg animate-pulse text-gray-500">
          Loading data...
        </div>
      ) : (
        <div className="rounded-2xl border border-white/20 shadow-2xl 
            backdrop-blur-xl bg-white/50 overflow-hidden">

          <div className="overflow-auto max-h-[75vh]">
            <table className="w-full table-auto">

              <thead className="bg-teal-600 text-white uppercase text-sm">
                <tr>
                  <th className="px-4 py-2">Login</th>
                  {symbols.map(symbol => (
                    <th key={symbol} className="px-3 py-2 text-center">
                      <span className="p-1 px-5 rounded-full bg-gray-900 text-white text-xs shadow">
                        {symbol}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>

                <tr className="bg-green-50 font-bold border-b border-gray-400">
                  <td className="text-center">All Login</td>
                  {symbols.map(symbol => (
                    <td key={symbol} className="px-3 py-2 text-center">
                      {totalRow[symbol]}
                    </td>
                  ))}
                </tr>

                {paginated.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100`}
                  >
                    <td className="px-4 py-2 text-center border-b font-medium">
                      {row.login}
                    </td>

                    {symbols.map(symbol => (
                      <td
                        key={symbol}
                        className={`px-3 py-2 text-center text-sm border-b border-gray-300 ${getHeatColor(
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

          {/* PAGINATION */}
          <div className="flex items-center justify-between p-4 bg-gray-100 border-t">

            <div className="text-sm text-gray-600">
              Page <b>{currentPage}</b> of <b>{totalPages}</b>
            </div>

            <div className="flex gap-2">

              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white hover:bg-gray-200 disabled:bg-gray-300"
              >
                ← Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded-md font-bold ${
                    currentPage === i + 1
                      ? "bg-teal-600 text-white"
                      : "bg-white hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white hover:bg-gray-200 disabled:bg-gray-300"
              >
                Next →
              </button>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default MatrixProfitAndLoss;
