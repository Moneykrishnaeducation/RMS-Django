import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-gray-800 text-white flex flex-col items-start p-4">
      <Link to="/dashboard" className="block py-2 px-4 hover:bg-gray-700 rounded mb-2">Dashboard</Link>
      <Link to="/accounts" className="block py-2 px-4 hover:bg-gray-700 rounded mb-2">Account Details</Link>
      <Link to="/filtersearch" className="block py-2 px-4 hover:bg-gray-700 rounded">Filter Search</Link>
      <Link to="/profile" className="block py-2 px-4 hover:bg-gray-700 rounded">Profile</Link>
      <Link to="/reports" className="block py-2 px-4 hover:bg-gray-700 rounded">Reports</Link>
      <Link to="/profitloss" className="block py-2 px-4 hover:bg-gray-700 rounded">P\L</Link>
      <Link to="/groups" className="block py-2 px-4 hover:bg-gray-700 rounded">Groups</Link>
      <Link to="/groupdashboard" className="block py-2 px-4 hover:bg-gray-700 rounded">GroupDashboard</Link>
      <Link to="/netlot" className="block py-2 px-4 hover:bg-gray-700 rounded">Net Lot</Link>
      <Link to="/trend" className="block py-2 px-4 hover:bg-gray-700 rounded">Trend</Link>
      <Link to="/matrixlot" className="block py-2 px-4 hover:bg-gray-700 rounded">Matrix Lot</Link>
      <Link to="/openPosistions" className="block py-2 px-4 hover:bg-gray-700 rounded">Open Posistions</Link>
      <Link to="/xauusd" className="block py-2 px-4 hover:bg-gray-700 rounded">XAUUSD</Link>
      <Link to="/filemanagement" className="block py-2 px-4 hover:bg-gray-700 rounded">File Management</Link>
      <Link to="/watchmanager" className="block py-2 px-4 hover:bg-gray-700 rounded">Watch Manager</Link>
    </nav>
  );
};
 
export default Navbar;
