import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Loading from "../CommonComponent/Loading";

const volume_API = "/api/lots/all/";

const NetLot = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [accounts, setAccounts] = useState([]);
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
          usd_pl: item.usd_pl || 0,
        };
      } else {
        map[sym].volume += item.volume || 0;
        map[sym].usd_pl += item.usd_pl || 0;
      }
    });

    return Object.values(map);
  };

  // Fetch groups and accounts
  useEffect(() => {
    const fetchGroupsAndAccounts = async () => {
      try {
        const groupsRes = await axios.get('/api/groups/db/');
        const accountsRes = await axios.get('/api/accounts/db/');

        setGroups(groupsRes.data.groups || []);
        setAccounts(accountsRes.data.accounts || []);
      } catch (err) {
        console.error("Fetch groups/accounts error:", err);
      }
    };

    fetchGroupsAndAccounts();
  }, []);

  // ===========================
  // FETCH + NORMALIZE DATA
  // ===========================
  useEffect(() => {
    if (!groups.length || !accounts.length) return;

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

        // Filter accounts whose group exists in groups
        const filteredAccounts = accounts.filter((a) => groups.includes(a.group));
        const filteredLogins = filteredAccounts.map((a) => a.login.toString());

        // Filter positions where login_id is in filtered accounts
        const filteredRows = rows.filter((item) => {
          const login = item.login_id?.toString();
          return login && filteredLogins.includes(login);
        });

        const df = filteredRows.map((item) => ({
          symbol: item.symbol || "",
          volume: Number(item.net_lot) || 0,
          usd_pl: Number(item.net_usd) || 0,
        }));

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
  }, [groups, accounts]);

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
      return { totalSymbols: 0, totalNetLot: 0 };

    return {
      totalSymbols: filteredData.length,
      totalNetLot: filteredData.reduce((sum, d) => sum + Number(d.volume), 0),
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
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl md:text-4xl font-bold mb-4 text-gray-800 text-center md:text-left">
        📊 Net Lot Dashboard
      </h1>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow-lg p-5 text-center rounded-lg">
          <p className="text-gray-500">Total Symbols</p>
          <p className="text-2xl font-bold">{totals.totalSymbols}</p>
        </div>

        <div className="bg-white shadow-lg p-5 text-center rounded-lg">
          <p className="text-gray-500">Total Net Lot</p>
          <p className="text-2xl font-bold text-blue-600">
            {(totals.totalNetLot || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search + CSV */}
      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Search symbol..."
          className="flex-1 min-w-[150px] px-4 py-2 rounded-xl border border-gray-300 shadow-sm
            focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button
          onClick={downloadCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto"
        >
          📥 Download CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-indigo-700 text-white uppercase text-sm">
              <th className="p-2 md:p-3 text-left">Symbol</th>
              <th className="p-2 md:p-3 text-center">Net Lot</th>
              <th className="p-2 md:p-3 text-center">USD P/L</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.length ? (
              filteredData.map((d, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-2 md:p-3">{d.symbol}</td>
                  <td className="p-2 md:p-3 text-center">{d.volume.toFixed(2)}</td>
                  <td className="p-2 md:p-3 text-center">{d.usd_pl.toFixed(2)}</td>
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
