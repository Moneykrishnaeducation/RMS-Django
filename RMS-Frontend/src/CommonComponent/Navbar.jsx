import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav>
      <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
      <Link to="/account-details">Account Details</Link>
    </nav>
  );
};
 
export default Navbar;
