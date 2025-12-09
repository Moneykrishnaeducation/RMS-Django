import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '../Pages/Dashboard';
import FilterSearch from '../Pages/FilterSearch';
import AccountDetails from '../Pages/AccountDetails';
import MainPage from '../CommonComponent/MainPage';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />}>
          <Route index element={<Dashboard />} />
          <Route path="account-details" element={<AccountDetails />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="filter-search" element={<FilterSearch />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
