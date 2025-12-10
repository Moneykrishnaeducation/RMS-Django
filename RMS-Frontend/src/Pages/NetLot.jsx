import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const NET_LOT_API = "http://127.0.0.1:8000/api/api/positions/open/"; // Replace with your API

const NetLot = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Net Lot data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(NET_LOT_API);
        // Handle different response structures
        let df = [];
        if (Array.isArray(res.data)) df = res.data;
        else if (res.data.results && Array.isArray(res.data.results)) df = res.data.results;
        else if (res.data.data && Array.isArray(res.data.data)) df = res.data.data;

        setData(df);
        setFilteredData(df);
      } catch (err) {
        console.error("Fetch error:", err.response || err.message);
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // auto-refresh every 15 sec
    return () => clearInterval(interval);
  }, []);

  // Filter data based on search
  useEffect(() => {
    if (!searchTerm) setFilteredData(data);
    else {
      const term = searchTerm.toLowerCase();
      setFilteredData(data.filter(d => d.symbol.toLowerCase().includes(term)));
    }
  }, [searchTerm, data]);

  // Compute totals
  const totals = useMemo(() => {
    if (!filteredData.length) return { totalSymbols: 0, totalNetLot: 0, totalUSDPL: 0 };
    return {
      totalSymbols: filteredData.length,
      totalNetLot: filteredData.reduce((sum, d) => sum + (Number(d.net_lot) || 0), 0),
      totalUSDPL: filteredData.reduce((sum, d) => sum + (Number(d.usd_pnl) || 0), 0),
    };
  }, [filteredData]);

  // CSV download
  const downloadCSV = () => {
    if (!filteredData.length) return;
    const header = Object.keys(filteredData[0]).join(",") + "\n";
    const rows = filteredData
      .map(row => Object.values(row).map(v => `"${v}"`).join(","))
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
      <h1 className="text-4xl font-bold mb-4 text-gray-800">📊 Net Lot Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-gray-500">Total Symbols</p>
          <p className="text-2xl font-bold text-gray-800">{totals.totalSymbols}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-gray-500">Total Net Lot</p>
          <p className="text-2xl font-bold text-blue-600">{totals.totalNetLot.toFixed(2)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-gray-500">Total USD P&L</p>
          <p className="text-2xl font-bold text-green-600">${totals.totalUSDPL.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & CSV */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search symbol..."
          className="border border-gray-300 rounded px-3 py-2 w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={downloadCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          📥 Download CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg p-4 border border-gray-200 overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
              <th className="p-3 border">Symbol</th>
              <th className="p-3 border">Net Lot</th>
              <th className="p-3 border">USD P&L</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length ? (
              filteredData.map((d, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors text-gray-700">
                  <td className="p-2 border font-medium">{d.symbol}</td>
                  <td className="p-2 border text-center">{Number(d.volume).toFixed(2)}</td>
                  <td className="p-2 border text-center">${Number(d.usd_pnl).toFixed(2)}</td>
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
