import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const FileManagement = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    server_ip: "",
    real_account_login: "",
    real_account_password: "",
    server_name_client: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [servers, setServers] = useState([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [serversError, setServersError] = useState(null);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch('/api/get-servers/');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setServers(data.data);
        } else {
          setServersError("Invalid data format received from API");
        }
      } catch (err) {
        console.error("Error fetching servers:", err);
        setServersError("Failed to fetch servers data");
      } finally {
        setServersLoading(false);
      }
    };

    fetchServers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.server_ip.trim() || !formData.real_account_login.trim() ||
        !formData.real_account_password.trim() || !formData.server_name_client.trim()) {
      setMessage("All fields are required.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/add-server/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Server settings added successfully!");
        setFormData({
          server_ip: "",
          real_account_login: "",
          real_account_password: "",
          server_name_client: ""
        });
        setTimeout(() => {
          setIsModalOpen(false);
          setMessage("");
        }, 2000);
      } else {
        setMessage(data.error || "Failed to add server settings.");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMessage("");
    setFormData({
      server_ip: "",
      real_account_login: "",
      real_account_password: "",
      server_name_client: ""
    });
  };

  const handleLoginSubmit = () => {
    if (password === "Vtindex@123") {
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Incorrect password. Please try again.");
    }
  };

  const handleLogin = async (server) => {
    try {
      const response = await fetch(`/api/get-server/${server.id}/`, {
        method: 'GET',
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Successfully logged in to server: ${server.server_name_client}`);
      } else {
        setMessage(data.error || "Failed to login to server.");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white px-10 py-10">
        {/* SECTION TITLE */}
        <h1 className="text-4xl font-bold text-gray-900 mb-10">
          File Management
        </h1>

        {/* LABEL */}
        <label className="block text-gray-700 font-medium mb-2">Password</label>

        {/* INPUT FIELD WITH TOGGLE */}
        <div className="relative w-full max-w-lg mb-4">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-[100%] py-3 px-4 bg-gray-100 border border-gray-200 rounded-lg
                       focus:ring-2 focus:ring-blue-400 outline-none"
          />

          {/* SHOW/HIDE BUTTON */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-600"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {loginError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-900 w-full max-w-lg">
            {loginError}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          onClick={handleLoginSubmit}
          className="px-6 py-2 border border-gray-300 rounded-lg
                     hover:bg-gray-100 transition"
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-10 py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">File Management</h1>

      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        Add Server
      </button>

      {/* Servers Table */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Servers</h2>

        {serversLoading ? (
          <div className="text-lg font-semibold">Loading servers...</div>
        ) : serversError ? (
          <div className="text-lg font-semibold text-red-600">Error: {serversError}</div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-xl">
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
        )}

        {servers.length === 0 && !serversLoading && !serversError && (
          <div className="text-center py-10 text-gray-500">
            No servers found.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Server Settings</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Server IP</label>
                <input
                  type="text"
                  name="server_ip"
                  value={formData.server_ip}
                  onChange={handleInputChange}
                  className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Enter server IP"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Real Account Login</label>
                <input
                  type="text"
                  name="real_account_login"
                  value={formData.real_account_login}
                  onChange={handleInputChange}
                  className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Enter real account login"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Real Account Password</label>
                <input
                  type="password"
                  name="real_account_password"
                  value={formData.real_account_password}
                  onChange={handleInputChange}
                  className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Enter real account password"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Server Name Client</label>
                <input
                  type="text"
                  name="server_name_client"
                  value={formData.server_name_client}
                  onChange={handleInputChange}
                  className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Enter server name client"
                />
              </div>

              {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.includes("successfully") ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add Server"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManagement;
