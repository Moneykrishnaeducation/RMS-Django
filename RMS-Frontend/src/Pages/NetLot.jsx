import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const volume_API = "http://127.0.0.1:8000/api/positions/open/";

const NetLot = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ===========================
  // GROUP UNIQUE SYMBOLS
  // ===========================
  const groupBySymbol = (rows) => {
    const map = {};

    rows.forEach((item) => {
      const sym = item.symbol || "";

      if (!map[sym]) {
        map[sym] = {
          symbol: sym,
          volume: item.volume || 0,
          profit: item.profit || 0,
        };
      } else {
        map[sym].volume += item.volume || 0;
        map[sym].profit += item.profit || 0;
      }
    });

    return Object.values(map);
  };

  // ===========================
  // FETCH + NORMALIZE DATA
  // ===========================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(volume_API);

        let rows =
          Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.results)
            ? res.data.results
            : Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.positions)
            ? res.data.positions
            : [];

        // Normalize data for all formats
        const df = rows.map((item) => ({
          symbol:
            item.symbol ||
            item.Symbol ||
            item.SYMBOL ||
            item.symbol_name ||
            item?.position?.symbol ||
            "",
          volume:
            Number(item.volume) ||
            Number(item.Volume) ||
            Number(item.lots) ||
            Number(item?.position?.volume) ||
            0,
          profit:
            Number(item.profit) ||
            Number(item.Profit) ||
            Number(item.pnl) ||
            Number(item?.position?.profit) ||
            0,
        }));

        // UNIQUE SYMBOL GROUPING
        const grouped = groupBySymbol(df);

        setData(grouped);
        setFilteredData(grouped);
      } catch (err) {
        console.error("Fetch error:", err);
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // ===========================
  // SEARCH FILTER
  // ===========================
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((d) =>
      d.symbol.toLowerCase().includes(term)
    );

    setFilteredData(filtered);
  }, [searchTerm, data]);

  // ===========================
  // TOTALS
  // ===========================
  const totals = useMemo(() => {
    if (!filteredData.length)
      return { totalSymbols: 0, totalNetLot: 0, totalUSDPL: 0 };

    return {
      totalSymbols: filteredData.length,
      totalNetLot: filteredData.reduce((sum, d) => sum + Number(d.volume), 0),
      totalUSDPL: filteredData.reduce((sum, d) => sum + Number(d.profit), 0),
    };
  }, [filteredData]);

  // ===========================
  // CSV DOWNLOAD
  // ===========================
  const downloadCSV = () => {
    if (!filteredData.length) return;

    const header = Object.keys(filteredData[0]).join(",") + "\n";
    const rows = filteredData
      .map((row) => Object.values(row).join(","))
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "net_lot_data.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">
        📊 Net Lot Dashboard
      </h1>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow-lg p-5 inset-shodow-lg text-center rounded-lg">
          <p className="text-gray-500">Total Symbols</p>
          <p className="text-2xl font-bold">{totals.totalSymbols}</p>
        </div>

        <div className="bg-white shadow-lg p-5 text-center rounded-lg">
          <p className="text-gray-500">Total Net Lot</p>
          <p className="text-2xl font-bold text-blue-600">
            {totals.totalNetLot.toFixed(2)}
          </p>
        </div>

        <div className="bg-white shadow-lg p-5 text-center rounded-lg">
          <p className="text-gray-500">Total USD P&L</p>
          <p className="text-2xl font-bold text-green-600">
            ${totals.totalUSDPL.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search + CSV */}
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search symbol..."
          className="w-80 px-4 py-2 rounded-xl border border-gray-300 shadow-sm
            focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button
          onClick={downloadCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          📥 Download CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-indigo-700 text-white uppercase text-sm">
              <th className="p-3">Symbol</th>
              <th className="p-3">Net Lot</th>
              <th className="p-3">USD P&L</th>
            </tr>     </thead>

          <tbody>
            {filteredData.length ? (
              filteredData.map((d, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="p-2 ">{d.symbol}</td>
                  <td className="p-2  text-center">
                    {d.volume.toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    {d.profit.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center p-4 text-gray-500">
                  No symbols found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NetLot;