import React, { useState } from 'react';

const ModalTest = () => {
  const [showModal, setShowModal] = useState(false);
  const [counter, setCounter] = useState(0);

  console.log('ModalTest component rendered:', { showModal, counter });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Modal Test Component</h1>
      
      {/* Always visible elements */}
      <div style={{ 
        border: '2px solid black', 
        padding: '10px', 
        margin: '10px 0',
        backgroundColor: 'lightblue'
      }}>
        <p>Counter: {counter}</p>
        <p>Modal State: {showModal ? 'OPEN' : 'CLOSED'}</p>
        <button onClick={() => setCounter(counter + 1)}>
          Increment Counter (Test: {counter})
        </button>
        <button onClick={() => setShowModal(!showModal)} style={{ marginLeft: '10px' }}>
          Toggle Modal (Current: {showModal ? 'OPEN' : 'CLOSED'})
        </button>
      </div>

      {/* Conditional modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          zIndex: '9999',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '50px',
            borderRadius: '10px',
            border: '5px solid blue'
          }}>
            <h2>MODAL IS WORKING!</h2>
            <p>Modal state: {String(showModal)}</p>
            <button onClick={() => setShowModal(false)}>
              Close Modal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalTest;
