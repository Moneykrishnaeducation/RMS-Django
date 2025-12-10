import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '../Pages/Dashboard';
import FilterSearch from '../Pages/FilterSearch';
import Profile from '../Pages/Profile';
import MainPage from '../CommonComponent/MainPage';
import Accounts from '../Pages/Accounts';
import Reports from '../Pages/Reports';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />}>
          <Route index element={<Dashboard />} />
          <Route path="Profile" element={<Profile />} />
          <Route path="accounts" element={<Accounts />}/>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="filtersearch" element={<FilterSearch />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
