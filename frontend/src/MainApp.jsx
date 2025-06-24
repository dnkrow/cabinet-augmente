import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import PatientList from './PatientList';
import PatientWorkspace from './PatientWorkspace';
import AddPatientModal from './AddPatientModal';
import './App.css';

function MainApp({ token, onLogout }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  const backendUrl = "https://super-duper-succotash-q7xvwjv9949jf66p6-8000.app.github.dev";

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setPatients(await response.json());
      } else if (response.status === 401) {
        onLogout();
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handlePatientAdded = (newPatient) => {
    setPatients(prevPatients => [...prevPatients, newPatient].sort((a,b) => a.nom.localeCompare(b.nom)));
  };

  // NOUVELLE FONCTION DE TEST
  const testAuthentication = async () => {
    console.log("Tentative d'appel à /api/medecins/me avec le token:", token);
    try {
      const response = await fetch(`${backendUrl}/api/medecins/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Authentification réussie ! Vous êtes connecté en tant que : ${data.email}`);
      } else {
        alert(`Échec de l'authentification : ${data.detail || 'Erreur inconnue'}`);
      }
    } catch (error) {
      alert("Erreur réseau lors du test d'authentification.");
    }
  };

  return (
    <div className="dashboard-container">
      {showAddPatientModal && (
        <AddPatientModal 
          onClose={() => setShowAddPatientModal(false)}
          onAdd={handlePatientAdded}
          token={token}
          backendUrl={backendUrl}
        />
      )}

      <Sidebar onLogout={onLogout}>
        <PatientList 
          patients={patients}
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatient}
          onAddPatient={() => setShowAddPatientModal(true)}
        />
        {/* NOUVEAU BOUTON DE TEST */}
        <button onClick={testAuthentication} style={{width: '100%', marginTop: '1rem'}}>
          Test Authentification
        </button>
      </Sidebar>

      <main className="main-content">
        {selectedPatient ? (
          <PatientWorkspace 
            patient={selectedPatient} 
            token={token} 
            backendUrl={backendUrl} 
          />
        ) : (
          <div className="welcome-message">
            <h1>Bienvenue, Docteur !</h1>
            <p>Veuillez sélectionner un patient pour commencer.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default MainApp;
