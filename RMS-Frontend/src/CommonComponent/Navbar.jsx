import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '20px' }}>
      <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
      <Link to="/account-details">Account Details</Link>
    </nav>
  );
};

export default Navbar;
