import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const ACCOUNTS_API = "http://127.0.0.1:8000/api/accounts/db/";
const POSITIONS_API = "http://127.0.0.1:8000/api/positions/open/";

const GroupDashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [accRes, posRes] = await Promise.all([
          axios.get(ACCOUNTS_API),
          axios.get(POSITIONS_API),
        ]);

        const accData = Array.isArray(accRes.data)
          ? accRes.data
          : accRes.data.accounts || accRes.data.results || [];
        setAccounts(accData);

        const posData = posRes.data.positions || [];
        setPositions(posData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Process accounts
  const processedAccounts = useMemo(() => {
    return accounts.map((d) => ({
      login: d.login || d.Login || 0,
      group: d.group || "Unknown",
    }));
  }, [accounts]);

  // Process positions
  const processedPositions = useMemo(() => {
    return positions.map((p) => ({
      login: p.login__login,
      symbol: p.symbol,
      volume: Number(p.volume || 0),
      profit: Number(p.profit || 0),
    }));
  }, [positions]);

  // Group summary
  const groupSummary = useMemo(() => {
    const map = {};

    // Accounts per group
    processedAccounts.forEach((d) => {
      if (!map[d.group]) map[d.group] = { group: d.group, accounts: 0, open_positions: 0, total_volume: 0, total_usd_pl: 0 };
      map[d.group].accounts += 1;
    });

    // Open positions per group
    processedPositions.forEach((pos) => {
      // Find group of this login
      const acc = processedAccounts.find((a) => a.login === pos.login);
      const g = acc?.group || "Unknown";
      if (!map[g]) map[g] = { group: g, accounts: 0, open_positions: 0, total_volume: 0, total_usd_pl: 0 };
      map[g].open_positions += 1;
      map[g].total_volume += pos.volume;
      map[g].total_usd_pl += pos.profit;
    });

    return Object.values(map);
  }, [processedAccounts, processedPositions]);

  // Totals
  const totals = useMemo(() => ({
    totalGroups: groupSummary.length,
    totalAccounts: groupSummary.reduce((a, b) => a + b.accounts, 0),
    totalPositions: groupSummary.reduce((a, b) => a + b.open_positions, 0),
    totalVolume: groupSummary.reduce((a, b) => a + b.total_volume, 0),
    totalUSDPL: groupSummary.reduce((a, b) => a + b.total_usd_pl, 0),
  }), [groupSummary]);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">🌟 Group Dashboard</h1>
      <p className="text-lg text-gray-700 mb-4">
  {totals.totalGroups} groups | {totals.totalAccounts} accounts | {totals.totalPositions} Total positions</p>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-4 border text-center">
          <p className="text-gray-500">Total Groups</p>
          <p className="text-2xl font-bold">{totals.totalGroups}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border text-center">
          <p className="text-gray-500">Total Accounts</p>
          <p className="text-2xl font-bold">{totals.totalAccounts}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border text-center">
          <p className="text-gray-500">Open Positions</p>
          <p className="text-2xl font-bold">{totals.totalPositions}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border text-center">
          <p className="text-gray-500">Total Net Lot</p>
          <p className="text-2xl font-bold text-blue-600">{totals.totalVolume.toFixed(2)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border text-center">
          <p className="text-gray-500">Total USD P&L</p>
          <p className="text-2xl font-bold text-green-600">${totals.totalUSDPL.toFixed(2)}</p>
        </div>
      </div>

      {/* Group Summary Table */}
      <div className="bg-white shadow rounded-lg p-4 border overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">📌 Group Summary Table</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
              <th className="p-3 border">Group</th>
              <th className="p-3 border">Accounts</th>
              <th className="p-3 border">Open Positions</th>
              <th className="p-3 border">Total Net Lot</th>
              <th className="p-3 border">Total USD P&L</th>
              <th className="p-3 border">Avg Net Lot</th>
              <th className="p-3 border">Avg USD P&L</th>
            </tr>
          </thead>
          <tbody>
            {groupSummary.map((g) => (
              <tr key={g.group} className="hover:bg-gray-50 transition-colors">
                <td className="p-2 border font-medium">{g.group}</td>
                <td className="p-2 border text-center">{g.accounts}</td>
                <td className="p-2 border text-center">{g.open_positions}</td>
                <td className="p-2 border text-center">{g.total_volume.toFixed(2)}</td>
                <td className="p-2 border text-center">${g.total_usd_pl.toFixed(2)}</td>
                <td className="p-2 border text-center">{g.accounts ? (g.total_volume / g.accounts).toFixed(2) : 0}</td>
                <td className="p-2 border text-center">{g.accounts ? (g.total_usd_pl / g.accounts).toFixed(2) : 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default GroupDashboard;
