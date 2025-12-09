import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '../CommonComponent/Navbar';
import AccountDetails from '../CommonComponent/MainPage';
import Dashboard from '../Pages/Dashboard';
import FilterSearch from '../Pages/FilterSearch';

const AppRoutes = () => {
  return (
    <Router>
      <Navbar />  
      <Routes>
        <Route path="/" element={<AccountDetails />} />
        <Route path="/account-details" element={<AccountDetails />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/account-details" element={<AccountDetails />} />
        <Route path="/filter-search" element={<FilterSearch />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;
