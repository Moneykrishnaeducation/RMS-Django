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
    </nav>
  );
};
 
export default Navbar;
