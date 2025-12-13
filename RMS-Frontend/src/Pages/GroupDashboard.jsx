import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Loading from "../CommonComponent/Loading";

const GROUP_SUMMARY_API = "/api/group-summary/";

const GroupDashboard = () => {
  const [groupSummary, setGroupSummary] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch groups data
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get('/api/groups/db/');
        setGroups(res.data.groups || []);
      } catch (err) {
        console.error("Fetch groups error:", err);
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(GROUP_SUMMARY_API);
        setGroupSummary(res.data.data || []);
      } catch (err) {
        console.error("Fetch group summary error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const totals = useMemo(
    () => ({
      totalGroups: groups.length,
      totalAccounts: groupSummary.reduce((a, b) => a + b.accounts, 0),
      totalPositions: groupSummary.reduce((a, b) => a + b.open_positions, 0),
      totalVolume: groupSummary.reduce((a, b) => a + b.total_net_lot, 0),
      totalUSDPL: groupSummary.reduce((a, b) => a + b.total_usd_pnl, 0),
    }),
    [groups, groupSummary]
  );

  if (loading) return <Loading message="Loading group dashboard data..." />;

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
            {groups.map((group) => {
              const summary = groupSummary.find((s) => s.group === group) || {
                accounts: 0,
                open_positions: 0,
                total_net_lot: 0,
                total_usd_pnl: 0,
                avg_net_lot: 0,
                avg_usd_pnl: 0,
              };
              return (
                <tr
                  key={group}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-2 md:p-3 font-medium">{group}</td>
                  <td className="p-2 md:p-3 text-center">{summary.accounts}</td>
                  <td className="p-2 md:p-3 text-center">{summary.open_positions}</td>
                  <td className="p-2 md:p-3 text-center">
                    {summary.total_net_lot.toFixed(2)}
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    ${summary.total_usd_pnl.toFixed(2)}
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    {summary.avg_net_lot.toFixed(2)}
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    ${summary.avg_usd_pnl.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupDashboard;
