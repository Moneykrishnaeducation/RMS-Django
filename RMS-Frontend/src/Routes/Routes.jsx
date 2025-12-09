import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '../CommonComponent/Navbar';
import AccountDetails from '../CommonComponent/MainPage';

const AppRoutes = () => {
  return (
    <Router>
      <Navbar />  
      <Routes>
        <Route path="/" element={<AccountDetails />} />
        <Route path="/account-details" element={<AccountDetails />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;
