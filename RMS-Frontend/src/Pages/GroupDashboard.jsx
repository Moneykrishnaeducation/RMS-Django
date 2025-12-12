import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const ACCOUNTS_API = "/api/accounts/db/";
const POSITIONS_API = "/api/positions/open/";

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

  const processedAccounts = useMemo(() => {
    return accounts.map((d) => ({
      login: d.login || d.Login || 0,
      group: d.group || "Unknown",
    }));
  }, [accounts]);

  const processedPositions = useMemo(() => {
    return positions.map((p) => ({
      login: p.login__login,
      symbol: p.symbol,
      volume: Number(p.volume || 0),
      profit: Number(p.profit || 0),
    }));
  }, [positions]);

  const groupSummary = useMemo(() => {
    const map = {};

    processedAccounts.forEach((d) => {
      if (!map[d.group])
        map[d.group] = {
          group: d.group,
          accounts: 0,
          open_positions: 0,
          total_volume: 0,
          total_usd_pl: 0,
        };
      map[d.group].accounts += 1;
    });

    processedPositions.forEach((pos) => {
      const acc = processedAccounts.find((a) => a.login === pos.login);
      const g = acc?.group || "Unknown";
      if (!map[g])
        map[g] = {
          group: g,
          accounts: 0,
          open_positions: 0,
          total_volume: 0,
          total_usd_pl: 0,
        };
      map[g].open_positions += 1;
      map[g].total_volume += pos.volume;
      map[g].total_usd_pl += pos.profit;
    });

    return Object.values(map);
  }, [processedAccounts, processedPositions]);

  const totals = useMemo(
    () => ({
      totalGroups: groupSummary.length,
      totalAccounts: groupSummary.reduce((a, b) => a + b.accounts, 0),
      totalPositions: groupSummary.reduce((a, b) => a + b.open_positions, 0),
      totalVolume: groupSummary.reduce((a, b) => a + b.total_volume, 0),
      totalUSDPL: groupSummary.reduce((a, b) => a + b.total_usd_pl, 0),
    }),
    [groupSummary]
  );

  if (loading) return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="p-2 bg-gray-100 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 text-center md:text-left">
        🌟 Group Dashboard
      </h1>
      <p className="text-md md:text-lg text-gray-700 mb-4 text-center md:text-left">
        {totals.totalGroups} groups | {totals.totalAccounts} accounts |{" "}
        {totals.totalPositions} Total positions
      </p>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-4 border text-center">
          <p className="text-gray-500 text-sm sm:text-base">Total Groups</p>
          <p className="text-2xl font-bold">{totals.totalGroups}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border text-center">
          <p className="text-gray-500 text-sm sm:text-base">Total Accounts</p>
          <p className="text-2xl font-bold">{totals.totalAccounts}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border text-center">
          <p className="text-gray-500 text-sm sm:text-base">Open Positions</p>
          <p className="text-2xl font-bold">{totals.totalPositions}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border text-center">
          <p className="text-gray-500 text-sm sm:text-base">Total Net Lot</p>
          <p className="text-2xl font-bold text-blue-600">
            {totals.totalVolume.toFixed(2)}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border text-center">
          <p className="text-gray-500 text-sm sm:text-base">Total USD P&L</p>
          <p className="text-2xl font-bold text-green-600">
            ${totals.totalUSDPL.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Group Summary Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full table-auto text-sm md:text-base">
          <thead>
            <tr className="bg-indigo-600 text-white uppercase text-xs sm:text-sm md:text-base">
              <th className="p-2 md:p-3 text-left">Group</th>
              <th className="p-2 md:p-3 text-center">Accounts</th>
              <th className="p-2 md:p-3 text-center">Open Positions</th>
              <th className="p-2 md:p-3 text-center">Total Net Lot</th>
              <th className="p-2 md:p-3 text-center">Total USD P&L</th>
              <th className="p-2 md:p-3 text-center">Avg Net Lot</th>
              <th className="p-2 md:p-3 text-center">Avg USD P&L</th>
            </tr>
          </thead>
          <tbody>
            {groupSummary.map((g) => (
              <tr
                key={g.group}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="p-2 md:p-3 font-medium">{g.group}</td>
                <td className="p-2 md:p-3 text-center">{g.accounts}</td>
                <td className="p-2 md:p-3 text-center">{g.open_positions}</td>
                <td className="p-2 md:p-3 text-center">
                  {g.total_volume.toFixed(2)}
                </td>
                <td className="p-2 md:p-3 text-center">
                  ${g.total_usd_pl.toFixed(2)}
                </td>
                <td className="p-2 md:p-3 text-center">
                  {g.accounts ? (g.total_volume / g.accounts).toFixed(2) : 0}
                </td>
                <td className="p-2 md:p-3 text-center">
                  {g.accounts ? (g.total_usd_pl / g.accounts).toFixed(2) : 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupDashboard;
