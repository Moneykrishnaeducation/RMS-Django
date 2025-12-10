import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api/accounts/db/"; // make sure your API returns the full accounts data

const GroupDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch accounts data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(API_BASE);
        let accounts = [];
        if (Array.isArray(res.data)) accounts = res.data;
        else if (res.data.accounts && Array.isArray(res.data.accounts)) accounts = res.data.accounts;
        else if (res.data.results && Array.isArray(res.data.results)) accounts = res.data.results;
        setData(accounts);
      } catch (err) {
        console.error("Fetch error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // auto-refresh every 15 sec
    return () => clearInterval(interval);
  }, []);

  // Remove detectColumn since it's unused (avoids ESLint warning)
  // const detectColumn = (df, possibleNames, defaultValue = 0) => {
  //   const lowerCols = df.length ? Object.keys(df[0]).map(c => c.toLowerCase()) : [];
  //   for (let name of possibleNames) {
  //     const idx = lowerCols.indexOf(name.toLowerCase());
  //     if (idx > -1) return df.map(r => Number(r[Object.keys(r)[idx]]) || defaultValue);
  //   }
  //   return df.map(() => defaultValue);
  // };

  const processedData = useMemo(() => {
    if (!data.length) return [];

    return data.map((d) => ({
      ...d,
      login: d.login || d.Login || 0,
      group: d.group || "Unknown",
      positions: Number(d.positions || d.pos || d.total_positions || 0),
      volume: Number(d.volume || d.net_lot || d.total_net_lot || 0),
      total_usd_pl: Number(d.total_usd_pl || d.profit || d.pl || 0),
    }));
  }, [data]);

  // Group summary
  const groupSummary = useMemo(() => {
    const map = {};
    processedData.forEach((d) => {
      const g = d.group || "Unknown";
      if (!map[g]) map[g] = { group: g, accounts: 0, positions: 0, volume: 0, total_usd_pl: 0 };
      map[g].accounts += 1;
      map[g].positions += d.positions;
      map[g].volume += d.volume;
      map[g].total_usd_pl += d.total_usd_pl;
    });
    return Object.values(map);
  }, [processedData]);

  // Totals
  const totals = useMemo(() => ({
    totalGroups: groupSummary.length,
    totalAccounts: groupSummary.reduce((a, b) => a + b.accounts, 0),
    totalPositions: groupSummary.reduce((a, b) => a + b.positions, 0),
    totalVolume: groupSummary.reduce((a, b) => a + b.volume, 0),
    totalUSDPL: groupSummary.reduce((a, b) => a + b.total_usd_pl, 0),
  }), [groupSummary]);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">🌟 Group Dashboard</h1>
      
      <div className="mb-6 text-gray-700">
        <p className="text-lg">
          {totals.totalGroups} groups | {totals.totalAccounts} accounts | {totals.totalPositions} total positions
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-gray-500">Total Groups</p>
          <p className="text-2xl font-bold text-gray-800">{totals.totalGroups}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-gray-500">Total Accounts</p>
          <p className="text-2xl font-bold text-gray-800">{totals.totalAccounts}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-gray-500">Total Net Lot</p>
          <p className="text-2xl font-bold text-blue-600">{totals.totalVolume.toFixed(2)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-gray-500">Total USD P&L</p>
          <p className="text-2xl font-bold text-green-600">${totals.totalUSDPL.toLocaleString()}</p>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white shadow rounded-lg p-4 border border-gray-200 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">📌 Group Summary Table</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
              <th className="p-3 border">Group</th>
              <th className="p-3 border">Accounts</th>
              <th className="p-3 border">Positions</th>
              <th className="p-3 border">Net Lot</th>
              <th className="p-3 border">Total USD P&L</th>
              <th className="p-3 border">Avg Net Lot</th>
              <th className="p-3 border">Avg USD P&L</th>
            </tr>
          </thead>
          <tbody>
            {groupSummary.map((g) => (
              <tr key={g.group} className="hover:bg-gray-50 transition-colors text-gray-700">
                <td className="p-2 border font-medium">{g.group}</td>
                <td className="p-2 border text-center">{g.accounts}</td>
                <td className="p-2 border text-center">{g.positions}</td>
                <td className="p-2 border text-center">{g.volume.toFixed(2)}</td>
                <td className="p-2 border text-center">${g.total_usd_pl.toFixed(2)}</td>
                <td className="p-2 border text-center">{(g.volume / g.accounts).toFixed(2)}</td>
                <td className="p-2 border text-center">{(g.total_usd_pl / g.accounts).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupDashboard;
