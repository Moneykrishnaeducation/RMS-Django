import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainPage = () => {
  return (
    <>
      <Navbar />
      <div className="ml-64 ">
        <Outlet />
      </div>
    </>
  );
};

export default MainPage;
