import React from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt, FaUsers, FaSearch, FaUser, FaFileAlt, FaDollarSign,
  FaLayerGroup, FaChartLine, FaProjectDiagram, FaBoxOpen, FaCoins, FaFile, FaEye,
  FaTimes
} from "react-icons/fa";

const Navbar = ({ isOpen, toggleNavbar }) => {
  const links = [
    { name: "Dashboard", to: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "Account Details", to: "/accounts", icon: <FaUsers /> },
    { name: "Filter Search", to: "/filtersearch", icon: <FaSearch /> },
    { name: "Profile", to: "/profile", icon: <FaUser /> },
    { name: "Reports", to: "/reports", icon: <FaFileAlt /> },
    { name: "P/L", to: "/profitloss", icon: <FaDollarSign /> },
    { name: "Groups", to: "/groups", icon: <FaLayerGroup /> },
    { name: "GroupDashboard", to: "/groupdashboard", icon: <FaChartLine /> },
    { name: "Symbol view ", to: "/symbolPositions ", icon: <FaChartLine /> },
    { name: "Net Lot", to: "/netlot", icon: <FaProjectDiagram /> },
    { name: "Trend", to: "/trend", icon: <FaChartLine /> },
    { name: "Matrix Lot", to: "/matrixlot", icon: <FaCoins /> },
    { name: "Matrix P&L", to: "/matrixprofitandloss", icon: <FaEye /> },
    { name: "Open Positions", to: "/openPosistions", icon: <FaBoxOpen /> },
    { name: "XAUUSD", to: "/xauusd", icon: <FaDollarSign /> },
    { name: "File Management", to: "/filemanagement", icon: <FaFile /> },
    { name: "Watch Manager", to: "/watchmanager", icon: <FaEye /> },
  ];

  return (
    <>
      {/* MOBILE OVERLAY ONLY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleNavbar}
        />
      )}

      {/* NAVBAR */}
      <nav
        className={`
          bg-gray-800 text-white flex flex-col p-4 z-40
          w-64 h-screen

          /* Desktop always visible */
          md:fixed md:left-0 md:top-0 md:translate-x-0

          /* Mobile toggle behavior */
          absolute top-0 left-0
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button for mobile only */}
        <button
          className="md:hidden text-white mb-4 ml-auto"
          onClick={toggleNavbar}
        >
          <FaTimes size={22} />
        </button>

        <img
          src="https://vtindex.com/img/logo/logo.svg"
          alt="logo"
          className="mx-auto mb-4 w-36"
        />

        <div className="overflow-y-auto scrollbar-hide flex-1 w-full">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => window.innerWidth < 768 && toggleNavbar()}
              className="
                flex items-center gap-3 py-2 px-4 mb-2 rounded-lg
                hover:bg-gray-700 hover:text-yellow-400
                transition-all text-white
              "
            >
              <span className="text-yellow-400 text-lg">{link.icon}</span>
              <span>{link.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
