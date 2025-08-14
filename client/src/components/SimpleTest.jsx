import React, { useState, useEffect } from 'react';

const SimpleTest = () => {
  const [count, setCount] = useState(0);
  const [showBox, setShowBox] = useState(false);
  
  // Log every render
  console.log('SimpleTest rendered:', { count, showBox });
  
  // Use useEffect to verify React is working
  useEffect(() => {
    console.log('SimpleTest useEffect triggered - count changed:', count);
  }, [count]);
  
  useEffect(() => {
    console.log('SimpleTest useEffect triggered - showBox changed:', showBox);
  }, [showBox]);
  
  return (
    <>
      {/* Force visibility with inline styles and !important */}
      <div style={{
        position: 'fixed !important',
        top: '10px !important',
        left: '10px !important',
        width: '300px !important',
        height: '200px !important',
        backgroundColor: 'red !important',
        color: 'white !important',
        padding: '20px !important',
        zIndex: '999999 !important',
        border: '5px solid yellow !important',
        fontSize: '18px !important',
        fontWeight: 'bold !important',
        fontFamily: 'Arial !important'
      }}>
        <div>REACT TEST COMPONENT</div>
        <div>Count: {count}</div>
        <div>Box: {showBox ? 'VISIBLE' : 'HIDDEN'}</div>
        
        <button 
          onClick={() => {
            console.log('Count button clicked, current:', count);
            setCount(count + 1);
          }}
          style={{
            background: 'blue !important',
            color: 'white !important',
            border: 'none !important',
            padding: '10px !important',
            margin: '5px !important',
            cursor: 'pointer !important'
          }}
        >
          Count: {count}
        </button>
        
        <button 
          onClick={() => {
            console.log('Box button clicked, current:', showBox);
            setShowBox(!showBox);
          }}
          style={{
            background: 'green !important',
            color: 'white !important',
            border: 'none !important',
            padding: '10px !important',
            margin: '5px !important',
            cursor: 'pointer !important'
          }}
        >
          Toggle Box
        </button>
      </div>
      
      {/* Conditional element */}
      {showBox && (
        <div style={{
          position: 'fixed !important',
          top: '250px !important',
          left: '10px !important',
          width: '200px !important',
          height: '100px !important',
          backgroundColor: 'blue !important',
          color: 'white !important',
          padding: '20px !important',
          zIndex: '999998 !important',
          border: '3px solid white !important'
        }}>
          CONDITIONAL BOX IS SHOWING!
          <br />
          State: {String(showBox)}
        </div>
      )}
    </>
  );
};

export default SimpleTest;
