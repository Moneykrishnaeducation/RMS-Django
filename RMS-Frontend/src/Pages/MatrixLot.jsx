import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const API_URL = "/api/lots/all/";

const MatrixLot = () => {
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
      const res = await axios.get(API_URL);
      const raw = res.data.data;

      const uniqueLogins = [...new Set(raw.map(i => i.login_id))];
      const uniqueSymbols = [...new Set(raw.map(i => i.symbol))];

      setSymbols(uniqueSymbols);

      // Construct matrix rows
      const table = uniqueLogins.map(login => {
        const row = { login };
        uniqueSymbols.forEach(symbol => {
          const item = raw.find(x => x.login_id === login && x.symbol === symbol);
          row[symbol] = item ? parseFloat(item.lot).toFixed(2) : "";
        });
        return row;
      });

      // Total row
      const total = { login: "All Login" };
      uniqueSymbols.forEach(symbol => {
        const sum = raw
          .filter(x => x.symbol === symbol)
          .reduce((a, b) => a + parseFloat(b.lot), 0);

        total[symbol] = sum ? sum.toFixed(2) : "";
      });

      setTotalRow(total);
      setMatrix(table);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // 🔍 FILTER MATRIX BY LOGIN
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

      {/* TITLE */}
      <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-3">
        <span>📊</span>
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Login vs Symbol Matrix – Net Lot
        </span>
      </h2>

      {/* 🔍 SEARCH BAR */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Login..."
          value={searchLogin}
          onChange={(e) => {
            setSearchLogin(e.target.value);
            setCurrentPage(1); // reset page on search
          }}
          className="
            w-80 px-4 py-2 rounded-xl border border-gray-300 shadow-sm
            focus:ring-2 focus:ring-blue-400 focus:outline-none transition
          "
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-lg animate-pulse text-gray-500">
          Loading data...
        </div>
      ) : (
        <div className="
          rounded-2xl border border-white/20 shadow-2xl 
          backdrop-blur-xl bg-white/50 overflow-hidden
        ">

          <div className="overflow-auto max-h-[75vh]">
            <table className="w-full table-auto">

              <thead className="bg-indigo-600 text-white uppercase text-sm">
                <tr>
                  <th className="bg-indigo-600 text-white uppercase text-sm">
                    Login
                  </th>
                  {symbols.map(symbol => (
                    <th key={symbol} className="px-3 py-2 text-center">
                      <span className="p-1 px-5 rounded-full bg-gray-800 text-white text-xs shadow">
                        {symbol}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>

                {/* TOTAL ROW */}
                <tr className="bg-blue-50 font-bold border-b border-gray-400">
                  <td className="hover:bg-gray-50 text-center transition-colors">
                    All Login
                  </td>
                  {symbols.map(symbol => (
                    <td key={symbol} className="px-3 border-b border-gray-400 py-2 text-center">
                      {totalRow[symbol]}
                    </td>
                  ))}
                </tr>

                {/* ROWS */}
                {paginated.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100`}
                  >
                    <td className="rounded-lg px-4 border-b text-center border-gray-400 py-2 sticky left-0 bg-white font-medium shadow-sm">
                      {row.login}
                    </td>

                    {symbols.map(symbol => (
                      <td
                        key={symbol}
                        className={`px-3 py-2 text-center text-sm border-b border-gray-400 ${getHeatColor(row[symbol])}`}
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
                className="px-4 py-2 rounded-lg text-sm font-medium shadow-md
                  bg-white hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500"
              >
                ← Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`
                    px-3 py-1 rounded-md text-sm font-bold transition 
                    ${currentPage === i + 1 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "bg-white hover:bg-gray-200"}
                  `}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium shadow-md
                  bg-white hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500"
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

export default MatrixLot;
