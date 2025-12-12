import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "/api";

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/get-servers/`);
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          setServers(response.data.data);
        } else {
          setError("Invalid data format received from API");
        }
      } catch (err) {
        console.error("Error fetching servers:", err);
        setError("Failed to fetch servers data");
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  const handleLogin = (server) => {
    // For now, just log the server details. You can implement actual login logic here
    console.log("Login to server:", server);
    alert(`Login to server: ${server.server_name_client} (${server.server_ip})`);
  };

  if (loading) return <div className="p-10 text-lg font-semibold">Loading servers...</div>;
  if (error) return <div className="p-10 text-lg font-semibold text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Servers</h1>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Server IP</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Real Account Login</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Server Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Created At</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Updated At</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {servers.map((server, idx) => (
                <tr key={server.id || idx} className="hover:bg-blue-50 transition-all border-b border-gray-200 last:border-none">
                  <td className="px-6 py-4 text-sm text-gray-700">{server.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{server.server_ip}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{server.real_account_login}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{server.server_name_client}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{new Date(server.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{new Date(server.updated_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleLogin(server)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-all"
                    >
                      Login
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {servers.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No servers found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Servers;
