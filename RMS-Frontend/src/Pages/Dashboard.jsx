import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

const API_BASE = 'http://127.0.0.1:8000/api'; // Django backend API base

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/accounts/db`);
        if (response.data && response.data.accounts) {
          if (Array.isArray(response.data.accounts)) {
            setData(response.data.accounts);
          } else if (typeof response.data.accounts === 'object') {
            setData(Object.values(response.data.accounts));
          } else {
            console.error('accounts is not array or object');
            setData([]);
          }
        } else {
          console.error('API returned invalid data');
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const isDemo = (g) => g?.toLowerCase().startsWith("demo");
  const isReal = (g) => !isDemo(g);

  const totalAccounts = data.length;
  const totalBalance = data.reduce((a, b) => a + (parseFloat(b.balance) || 0), 0);
  const totalEquity = data.reduce((a, b) => a + (parseFloat(b.equity) || 0), 0);
  const totalPL = data.reduce((a, b) => a + (parseFloat(b.profit) || 0), 0);

  const topProfitReal = [...data].filter(r => isReal(r.group))
    .sort((a, b) => b.profit - a.profit)[0];

  const topProfitDemo = [...data].filter(r => isDemo(r.group))
    .sort((a, b) => b.profit - a.profit)[0];

  const topAccounts = [...data]
    .sort((a, b) => b.equity - a.equity)
    .slice(0, 10);

  const worstBalances = [...data]
    .filter(r => isReal(r.group))
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 10);

  const groupTable = useMemo(() => {
    const summary = {};
    data.forEach(acc => {
      const grp = acc.group || "Unknown";
      if (!summary[grp]) summary[grp] = { count: 0, balance: 0, equity: 0 };

      summary[grp].count++;
      summary[grp].balance += parseFloat(acc.balance) || 0;
      summary[grp].equity += parseFloat(acc.equity) || 0;
    });

    return Object.keys(summary).map(g => ({
      group: g,
      count: summary[g].count,
      balance_sum: summary[g].balance,
      equity_sum: summary[g].equity
    }));
  }, [data]);

  const cardStats = [
    { label: "Total Accounts", value: totalAccounts },
    { label: "Total Balance", value: `$${totalBalance.toLocaleString()}` },
    { label: "Total Equity", value: `$${totalEquity.toLocaleString()}` },
    { label: "Total P/L", value: `$${totalPL.toLocaleString()}` },
    {
      label: "Top Profit (Real)",
      value: topProfitReal ? `${topProfitReal.name} $${topProfitReal.profit.toLocaleString()}` : "--"
    },
    {
      label: "Top Profit (Demo)",
      value: topProfitDemo ? `${topProfitDemo.name} $${topProfitDemo.profit.toLocaleString()}` : "--"
    }
  ];

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-900">
        📊 RMS — Accounts Dashboard
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-10">
        {cardStats.map((item, i) => (
          <div key={i} className="bg-gradient-to-br from-indigo-700 to-purple-700 rounded-xl text-white p-4 shadow-lg">
            <p className="text-xs opacity-70">{item.label}</p>
            <p className="font-bold text-lg mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Top Accounts */}
      <Section title="Top 10 Accounts by Equity">
        <Table
          headers={["Login", "Name", "Group", "Equity"]}
          rows={topAccounts.map(r => [r.login, r.name, r.group, r.equity.toLocaleString()])}
        />
      </Section>

      {/* Worst Real Balances */}
      <Section title="Worst Balances (Real Accounts)">
        <Table
          headers={["Login", "Name", "Group", "Balance"]}
          rows={worstBalances.map(r => [r.login, r.name, r.group, r.balance.toLocaleString()])}
        />
      </Section>

      {/* Group Summary */}
      <Section title="Group Summary">
        <Table
          headers={["Group", "Count", "Balance Sum", "Equity Sum"]}
          rows={groupTable.map(g => [
            g.group,
            g.count,
            g.balance_sum.toLocaleString(),
            g.equity_sum.toLocaleString()
          ])}
        />
      </Section>

    </div>
  );
};

export default Dashboard;

/* ---------- Reusable UI Components ---------- */

const Section = ({ title, children }) => (
  <div className="mb-10">
    <h3 className="text-xl font-bold mb-3 text-gray-800">{title}</h3>
    {children}
  </div>
);

const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto bg-white rounded-lg shadow">
    <table className="min-w-full">
      <thead className="bg-gray-900 text-white">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="p-3 text-sm font-semibold text-left">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b hover:bg-gray-100 transition">
            {r.map((c, j) => (
              <td key={j} className="p-3 text-sm">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
