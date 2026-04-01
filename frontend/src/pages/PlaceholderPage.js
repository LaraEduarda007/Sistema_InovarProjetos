import React from 'react';
import MainLayout from '../components/MainLayout';
import Topbar from '../components/Topbar';
import './PlaceholderPage.css';

function PlaceholderPage({ title, subtitle }) {
  return (
    <MainLayout>
      <Topbar 
        title={title} 
        subtitle={subtitle}
      />

      <div className="placeholder-container">
        <div className="placeholder-box">
          <div className="placeholder-icon">○</div>
          <h2>Página em desenvolvimento</h2>
          <p>Esta funcionalidade será implementada em breve.</p>
        </div>
      </div>
    </MainLayout>
  );
}

export default PlaceholderPage;
