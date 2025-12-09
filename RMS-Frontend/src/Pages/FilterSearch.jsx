import React, { useState, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const AccountsDashboard = ({ data }) => {
  const [accountType, setAccountType] = useState("Real Account");
  const [loginFilter, setLoginFilter] = useState("All");
  const [nameFilter, setNameFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");

  const isDemo = (group) => group?.toLowerCase().startsWith("demo");
  const isReal = (group) => !group?.toLowerCase().startsWith("demo");

  const totalReal = data.filter((row) => isReal(row.group)).length;
  const totalDemo = data.filter((row) => isDemo(row.group)).length;

  const filteredRows = useMemo(() => {
    let filtered = data.filter(row =>
      accountType === "Real Account" ? isReal(row.group) : isDemo(row.group)
    );

    if (loginFilter !== "All") filtered = filtered.filter(r => r.login === loginFilter);
    if (nameFilter !== "All") filtered = filtered.filter(r => r.name === nameFilter);
    if (groupFilter !== "All") filtered = filtered.filter(r => r.group === groupFilter);

    return filtered;
  }, [data, accountType, loginFilter, nameFilter, groupFilter]);

  return (
    <div className="container mt-5">
      <h2 className="fw-bold mb-3">🔍 Advanced Filter Search</h2>

      <p>
        <strong>Total Real Accounts:</strong> {totalReal} &nbsp; | &nbsp;
        <strong>Total Demo Accounts:</strong> {totalDemo}
      </p>

      {/* Radio Button */}
      <div className="mb-3">
        <label className="form-label fw-bold">Select Account Type</label>
        <div>
          <label className="me-3">
            <input
              type="radio"
              value="Real Account"
              checked={accountType === "Real Account"}
              onChange={() => setAccountType("Real Account")}
            />{" "}
            Real Account
          </label>
          <label>
            <input
              type="radio"
              value="Demo Account"
              checked={accountType === "Demo Account"}
              onChange={() => setAccountType("Demo Account")}
            />{" "}
            Demo Account
          </label>
        </div>
      </div>

      {/* Filter dropdowns */}
      <div className="row mb-4">
        <div className="col">
          <label className="form-label">Filter by Login</label>
          <select
            className="form-select"
            value={loginFilter}
            onChange={(e) => setLoginFilter(e.target.value)}
          >
            <option>All</option>
            {Array.from(new Set(data.map(item => item.login))).map((login, idx) =>
              <option key={idx}>{login}</option>
            )}
          </select>
        </div>

        <div className="col">
          <label className="form-label">Filter by Name</label>
          <select
            className="form-select"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          >
            <option>All</option>
            {Array.from(new Set(data.map(item => item.name))).map((name, idx) =>
              <option key={idx}>{name}</option>
            )}
          </select>
        </div>

        <div className="col">
          <label className="form-label">Filter by Base Symbol (Group)</label>
          <select
            className="form-select"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option>All</option>
            {Array.from(new Set(data.map(item => item.group))).map((grp, idx) =>
              <option key={idx}>{grp}</option>
            )}
          </select>
        </div>
      </div>

      {/* Results */}
      <h5>{accountType} Matching Filters</h5>
      <p><strong>{filteredRows.length} accounts found</strong></p>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Login</th>
              <th>Name</th>
              <th>Email</th>
              <th>Group</th>
              <th>Leverage</th>
              <th>Balance</th>
              <th>Equity</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={index}>
                <td>{row.login}</td>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{row.group}</td>
                <td>{row.leverage}</td>
                <td>{row.balance}</td>
                <td>{row.equity}</td>
                <td>{row.profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountsDashboard;
