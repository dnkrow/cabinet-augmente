import React from 'react';
import './PatientList.css';

const PatientList = ({ patients, selectedPatient, onSelectPatient, onAddPatient }) => {
  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <h3>Patients</h3>
        <button onClick={onAddPatient} className="add-patient-btn" title="Ajouter un patient">+</button>
      </div>
      <div className="patient-search">
        <input type="text" placeholder="Rechercher un patient..." />
      </div>
      <ul className="patient-list">
        {patients.map(patient => (
          <li 
            key={patient.id} 
            className={`patient-item ${selectedPatient?.id === patient.id ? 'active' : ''}`}
            onClick={() => onSelectPatient(patient)}
          >
            <span className="patient-name">{patient.nom.toUpperCase()} {patient.prenom}</span>
            <span className="patient-dob">{patient.date_naissance}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PatientList;
