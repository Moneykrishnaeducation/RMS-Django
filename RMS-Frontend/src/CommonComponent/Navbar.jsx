import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaTachometerAlt, FaUsers, FaSearch, FaUser, FaFileAlt, FaDollarSign, 
  FaLayerGroup, FaChartLine, FaProjectDiagram, FaBoxOpen, FaCoins, FaFile, FaEye 
} from "react-icons/fa";

const Navbar = () => {
  const links = [
    { name: "Dashboard", to: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "Account Details", to: "/accounts", icon: <FaUsers /> },
    { name: "Filter Search", to: "/filtersearch", icon: <FaSearch /> },
    { name: "Profile", to: "/profile", icon: <FaUser /> },
    { name: "Reports", to: "/reports", icon: <FaFileAlt /> },
    { name: "P/L", to: "/profitloss", icon: <FaDollarSign /> },
    { name: "Groups", to: "/groups", icon: <FaLayerGroup /> },
    { name: "GroupDashboard", to: "/groupdashboard", icon: <FaChartLine /> },
    { name: "Net Lot", to: "/netlot", icon: <FaProjectDiagram /> },
    { name: "Trend", to: "/trend", icon: <FaChartLine /> },
    { name: "Matrix Lot", to: "/matrixlot", icon: <FaCoins /> },
    { name: "Open Positions", to: "/openPosistions", icon: <FaBoxOpen /> },
    { name: "XAUUSD", to: "/xauusd", icon: <FaDollarSign /> },
    { name: "File Management", to: "/filemanagement", icon: <FaFile /> },
    { name: "Watch Manager", to: "/watchmanager", icon: <FaEye /> },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-gray-800 text-white flex flex-col items-start p-4">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="block py-2 px-4 hover:bg-gray-700 rounded mb-2 flex items-center gap-2"
        >
          <span>{link.icon}</span>
          <span>{link.name}</span>
        </Link>
      ))}
    </nav>
  );
};

export default Navbar;
