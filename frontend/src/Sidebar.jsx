import React from 'react';
import './Sidebar.css'; // On importe le fichier de style

const Sidebar = ({ children, onLogout }) => {
  return (
    <aside className="sidebar">
      {/* Cette partie contiendra la liste des patients */}
      <div className="sidebar-content">
        {children}
      </div>
      
      {/* Cette partie contient le bouton de déconnexion en bas */}
      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-button">
          Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
