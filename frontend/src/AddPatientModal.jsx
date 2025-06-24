import React, { useState } from 'react';
// Note: Le style de la modale est dans App.css pour simplifier

const AddPatientModal = ({ onAdd, onClose, token, backendUrl }) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backendUrl}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nom, prenom, date_naissance: dateNaissance })
      });

      if (response.ok) {
        const newPatient = await response.json();
        onAdd(newPatient); // Appelle la fonction pour rafraîchir la liste dans MainApp
        onClose(); // Ferme la modale
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.detail || 'Impossible de créer le patient.'}`);
      }
    } catch (error) {
      alert("Erreur réseau lors de la création du patient.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="modal-close-btn">&times;</button>
        <h2>Ajouter un nouveau patient</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Prénom</label>
            <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Date de naissance</label>
            <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
