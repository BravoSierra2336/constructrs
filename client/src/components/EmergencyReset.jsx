import React from 'react';

const EmergencyReset = () => {
  const handleReset = () => {
    console.log('Emergency reset triggered');
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force reload
    window.location.href = '/';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: '999999',
      backgroundColor: 'red',
      color: 'white',
      padding: '10px',
      border: '2px solid white',
      cursor: 'pointer',
      fontWeight: 'bold'
    }} onClick={handleReset}>
      EMERGENCY RESET
      <br />
      (Click if stuck)
    </div>
  );
};

export default EmergencyReset;
