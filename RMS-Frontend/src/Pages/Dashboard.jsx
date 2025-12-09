import React, { useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./cards.css"; // custom gradient card styling

const RMSDashboard = ({ data }) => {

  // Helpers
  const isDemo = (g) => g?.toLowerCase().startsWith("demo");
  const isReal = (g) => !isDemo(g);

  // Stats
  const totalAccounts = data.length;
  const totalBalance = data.reduce((a, b) => a + (parseFloat(b.balance) || 0), 0);
  const totalEquity = data.reduce((a, b) => a + (parseFloat(b.equity) || 0), 0);
  const totalPL = data.reduce((a, b) => a + (parseFloat(b.profit) || 0), 0);

  const topProfitReal = [...data]
    .filter(row => isReal(row.group))
    .sort((a, b) => b.profit - a.profit)[0];

  const topProfitDemo = [...data]
    .filter(row => isDemo(row.group))
    .sort((a, b) => b.profit - a.profit)[0];

  // Top accounts by equity
  const topAccounts = [...data]
    .sort((a, b) => b.equity - a.equity)
    .slice(0, 10);

  // Worst balances in Real accounts
  const worstBalances = [...data]
    .filter(r => isReal(r.group))
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 10);

  // Group summary
  const groupTable = useMemo(() => {
    const summary = {};
    data.forEach(acc => {
      const grp = acc.group || "Unknown";
      if (!summary[grp]) {
        summary[grp] = { count: 0, balance: 0, equity: 0 };
      }
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

  return (
    <div className="container mt-5">
      <h2 className="fw-bold mb-4">RMS — Accounts Dashboard</h2>

      {/* Top Stats */}
      <div className="row g-3 mb-4">
        {[
          { title: "Total Accounts", value: totalAccounts },
          { title: "Total Balance", value: `$${totalBalance.toLocaleString()}` },
          { title: "Total Equity", value: `$${totalEquity.toLocaleString()}` },
          { title: "Total P/L", value: `$${totalPL.toLocaleString()}` },
          {
            title: "Top Profit (Real)",
            value: topProfitReal ? `${topProfitReal.name} $${topProfitReal.profit.toLocaleString()}` : "--"
          },
          {
            title: "Top Profit (Demo)",
            value: topProfitDemo ? `${topProfitDemo.name} $${topProfitDemo.profit.toLocaleString()}` : "--"
          }
        ].map((item, i) => (
          <div key={i} className="col-md-4 col-lg-2">
            <div className="stats-card">
              <h5 className="mb-2">{item.title}</h5>
              <div className="fw-bold small text-center">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Accounts */}
      <h4 className="mt-4">Top Accounts</h4>
      <div className="table-responsive mb-4">
        <table className="table table-hover table-sm">
          <thead className="table-dark">
            <tr>
              <th>login</th>
              <th>name</th>
              <th>group</th>
              <th>equity</th>
            </tr>
          </thead>
          <tbody>
            {topAccounts.map((row, i) => (
              <tr key={i}>
                <td>{row.login}</td>
                <td>{row.name}</td>
                <td>{row.group}</td>
                <td>{row.equity.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Worst Real Balances */}
      <h4 className="mt-5">Worst Balances (Real)</h4>
      <div className="table-responsive mb-4">
        <table className="table table-hover table-sm">
          <thead className="table-dark">
            <tr>
              <th>login</th>
              <th>name</th>
              <th>group</th>
              <th>balance</th>
            </tr>
          </thead>
          <tbody>
            {worstBalances.map((row, i) => (
              <tr key={i}>
                <td>{row.login}</td>
                <td>{row.name}</td>
                <td>{row.group}</td>
                <td>{row.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Group Summary */}
      <h4 className="mt-5">Groups</h4>
      <div className="table-responsive">
        <table className="table table-sm table-striped">
          <thead className="table-dark">
            <tr>
              <th>Group</th>
              <th>Count</th>
              <th>Balance Sum</th>
              <th>Equity Sum</th>
            </tr>
          </thead>
          <tbody>
            {groupTable.map((row, i) => (
              <tr key={i}>
                <td>{row.group}</td>
                <td>{row.count}</td>
                <td>{row.balance_sum.toLocaleString()}</td>
                <td>{row.equity_sum.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default RMSDashboard;
