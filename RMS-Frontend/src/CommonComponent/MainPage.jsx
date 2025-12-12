import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { FaBars } from "react-icons/fa";

const MainPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNavbar = () => setIsOpen(!isOpen);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between bg-gray-800 text-white p-4 shadow relative">
        <button onClick={toggleNavbar}>
          <FaBars size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold">RMS</h1>
      </div>

      {/* SIDEBAR */}
      <Navbar isOpen={isOpen} toggleNavbar={toggleNavbar} />

      {/* PAGE CONTENT */}
      <div className="md:ml-64">

        {/* DESKTOP HEADING */}
        <div className="flex hidden md:block items-center text-center justify-center bg-gray-800 text-white p-4 shadow">
  <h1 className="text-xl font-bold">RMS</h1>
</div>

        <Outlet />
      </div>
    </div>
  );
};

export default MainPage;
