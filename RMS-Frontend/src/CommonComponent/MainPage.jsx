import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { FaBars } from "react-icons/fa";

const MainPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNavbar = () => setIsOpen(!isOpen);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top Bar (mobile only) */}
      <div className="md:hidden flex items-center justify-between bg-gray-800 text-white p-4 shadow">
        <button onClick={toggleNavbar}>
          <FaBars size={22} />
        </button>
        <h1 className="text-xl font-bold">RMS</h1>
      </div>

      {/* Sidebar */}
      <Navbar isOpen={isOpen} toggleNavbar={toggleNavbar} />

      {/* Page Content */}
      <div className="md:p-4 md:ml-64">
        <Outlet />
      </div>

    </div>
  );
};

export default MainPage;
