import React, { useEffect, useState } from "react";
import axios from "axios";

const XAUUSDPositions = () => {
  const [positions, setPositions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch positions
        const posRes = await axios.get("/api/positions/open/"); // replace with your API
        const posData = posRes.data?.data || [];
        setPositions(Array.isArray(posData) ? posData : []);

        // Fetch accounts
        const accRes = await axios.get("/api/accounts"); // replace with your API
        const accData = accRes.data?.data || [];
        setAccounts(Array.isArray(accData) ? accData : []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and aggregate
  const filteredData = (Array.isArray(positions) ? positions : [])
    .filter((p) => p.Symbol === "XAUUSD")
    .filter((p) => {
      if (filter === "buy") return p.Type === "Buy";
      if (filter === "sell") return p.Type === "Sell";
      return true;
    })
    .reduce((acc, p) => {
      const login = p.Login.toString();
      const vol = p.Type === "Sell" ? -parseFloat(p.Vol) : parseFloat(p.Vol);

      if (!acc[login]) acc[login] = { net_lot: 0 };
      acc[login].net_lot += vol;
      return acc;
    }, {});

  const tableData = Object.entries(filteredData).map(([login, vals]) => {
    const account = accounts.find((a) => a.login.toString() === login) || {};
    return {
      Login: login,
      Name: account.name || "Unknown",
      Group: account.group || "Unknown",
      "Base Symbol": "XAUUSD",
      Type:
        vals.net_lot > 0 ? "Buy" : vals.net_lot < 0 ? "Sell" : "Neutral",
      "Net Lot": vals.net_lot,
      "USD P&L": account.profit || 0,
    };
  });

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">XAUUSD Positions</h2>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${
            filter === "all" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("buy")}
          className={`px-4 py-2 rounded ${
            filter === "buy" ? "bg-green-500 text-white" : "bg-gray-200"
          }`}
        >
          XAUUSD Buy
        </button>
        <button
          onClick={() => setFilter("sell")}
          className={`px-4 py-2 rounded ${
            filter === "sell" ? "bg-red-500 text-white" : "bg-gray-200"
          }`}
        >
          XAUUSD Sell
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading data...</p>
      ) : tableData.length === 0 ? (
        <p className="text-gray-500">
          {positions.length === 0
            ? "No data available. Please wait for background scan."
            : "No XAUUSD data found."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                {Object.keys(tableData[0]).map((key) => (
                  <th
                    key={key}
                    className="py-2 px-4 border-b text-left text-gray-700"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="py-2 px-4 border-b">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default XAUUSDPositions;
