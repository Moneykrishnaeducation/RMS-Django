import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '../Pages/Dashboard';
import FilterSearch from '../Pages/FilterSearch';
import Profile from '../Pages/Profile';
import MainPage from '../CommonComponent/MainPage';
import Accounts from '../Pages/Accounts';
import Reports from '../Pages/Reports';
import ProfitLoss from '../Pages/ProfitLoss';
import Groups from '../Pages/Groups';
import GroupDashboard from '../Pages/GroupDashboard';
import NetLot from '../Pages/NetLot';
import Trend from '../Pages/Trend';
import MatrixLot from '../Pages/MatrixLot';
import OpenPosition from '../Pages/OpenPosition';
import XAUUSD from '../Pages/Xauusd';
import FileManagement from '../Pages/FileManagement';
import WatchManager from '../Pages/WatchManager';

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
          <Route path="profitloss" element={<ProfitLoss />} />
          <Route path="groups" element={<Groups />} />
          <Route path="groupdashboard" element={<GroupDashboard />} />
          <Route path="netlot" element={<NetLot />} />
          <Route path="trend" element={<Trend />} />
          <Route path="matrixlot" element={<MatrixLot />} />
          <Route path="openPosistions" element={<OpenPosition />} />
          <Route path="xauusd" element={<XAUUSD />} />
          <Route path="filemanagement" element={<FileManagement />} />
          <Route path="watchmanager" element={<WatchManager />} />

        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
