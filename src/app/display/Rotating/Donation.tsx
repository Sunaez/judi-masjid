'use client';
import React from 'react';

export default function Donation() {
  return (
    <div className="rotating-content donation">
      <div className="primary">
        <div className="welcome">
          <span className="urgency">Help out our Masjid</span>
        </div>
        <div className="wrapper">
          <div className="jummah">Name: SBKC</div>
        </div>
        <div className="wrapper">
          <div className="jummah pr">Sort Code: 51-70-32</div>
        </div>
        <div className="wrapper">
          <div className="jummah pr">Acc no: 89886445</div>
        </div>
        <div className="wrapper">
          <div className="jummah">
            Please <span className="urgency">donate generously!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
