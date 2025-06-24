import React, { useState, useRef, useEffect } from 'react';
import './PatientWorkspace.css';

// --- SOUS-COMPOSANT POUR L'HISTORIQUE ---
const HistoryModule = ({ consultations }) => (
  <div className="history-module">
    {consultations.length === 0 ? (
      <p>Aucune consultation enregistrée pour ce patient.</p>
    ) : (
      <ul className="consultation-list">
        {consultations.sort((a,b) => new Date(b.creation_date) - new Date(a.creation_date)).map(consult => (
          <li key={consult.id} className="consultation-item">
            <div className="consultation-header">
              <strong>{consult.type === 'dictation' ? 'Note de Dictée' : 'Résumé de Document'}</strong>
              <span>{new Date(consult.creation_date).toLocaleDateString()}</span>
            </div>
            <p className="consultation-content">{consult.content}</p>
          </li>
        ))}
      </ul>
    )}
  </div>
);

// --- SOUS-COMPOSANT POUR LE MODULE DE DICTÉE ---
const DictationModule = ({ token, backendUrl, patientId, onConsultationAdded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef(null);

  const handleDictation = (audioBlob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("audioFile", audioBlob, "dictation.webm");
    
    fetch(`${backendUrl}/api/dictation/${patientId}`, {
      method: "POST",
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    })
    .then(res => res.json()).then(data => {
      if (data.id) {
        onConsultationAdded(data);
      } else {
        alert("Erreur: " + (data.detail || "La transcription a échoué."));
      }
    }).catch(() => alert("Erreur réseau")).finally(() => setIsLoading(false));
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioChunks = [];
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            handleDictation(audioBlob);
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) { console.error("Erreur micro:", err); }
  };
  
  const stopRecording = () => {
    if(mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  return (
    <div className="ia-module">
      <p>Cliquez pour démarrer une nouvelle consultation vocale pour ce patient.</p>
      <button className={`record-button ${isRecording ? 'is-recording' : ''}`} onClick={isRecording ? stopRecording : startRecording} disabled={isLoading}>
        {isLoading ? 'Sauvegarde...' : (isRecording ? 'Arrêter la dictée' : 'Démarrer la dictée')}
      </button>
      {isLoading && <p className="loading-text">Transcription et sauvegarde en cours...</p>}
    </div>
  );
};

// --- SOUS-COMPOSANT POUR LE MODULE DE DOCUMENTS ---
const DocumentModule = ({ token, backendUrl, patientId, onConsultationAdded }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDocumentDrop = (file) => {
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("documentFile", file);

    fetch(`${backendUrl}/api/document/${patientId}`, {
      method: "POST",
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    })
    .then(res => res.json()).then(data => {
      if(data.id) {
        onConsultationAdded(data);
      } else {
        alert("Erreur: " + (data.detail || "L'analyse du document a échoué."));
      }
    }).catch(() => alert("Erreur réseau")).finally(() => setIsAnalyzing(false));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleDocumentDrop(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="ia-module">
       <p>Déposez un document (PDF) pour l'analyser et l'ajouter au dossier.</p>
      <div className={`drop-zone ${isDragging ? 'dragging' : ''}`} onDragOver={(e) => {e.preventDefault(); setIsDragging(true);}} onDragLeave={() => setIsDragging(false)} onDrop={onDrop}>
        <p>Glissez-déposez ici.</p>
      </div>
      {isAnalyzing && <p className="loading-text">Analyse et sauvegarde en cours...</p>}
    </div>
  );
};


// --- COMPOSANT PRINCIPAL DE L'ESPACE DE TRAVAIL ---
const PatientWorkspace = ({ patient, token, backendUrl }) => {
  const [activeModule, setActiveModule] = useState('history');
  const [consultations, setConsultations] = useState(patient.consultations || []);

  // Met à jour la liste des consultations si le patient change
  useEffect(() => {
    setConsultations(patient.consultations || []);
    setActiveModule('history');
  }, [patient]);

  // Fonction pour ajouter une nouvelle consultation à la liste en temps réel
  const handleNewConsultation = (newConsultation) => {
    setConsultations(prev => [newConsultation, ...prev]);
    setActiveModule('history'); // Revenir à l'historique après l'ajout
  };

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        <h2>Dossier de {patient.prenom} {patient.nom}</h2>
        <p>Date de naissance: {patient.date_naissance}</p>
      </div>
      
      <div className="module-tabs">
        <button 
          className={`tab-btn ${activeModule === 'history' ? 'active' : ''}`}
          onClick={() => setActiveModule('history')}
        >
          Historique
        </button>
        <button 
          className={`tab-btn ${activeModule === 'dictation' ? 'active' : ''}`}
          onClick={() => setActiveModule('dictation')}
        >
          Nouvelle Dictée
        </button>
        <button 
          className={`tab-btn ${activeModule === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveModule('documents')}
        >
          Analyser Document
        </button>
      </div>

      <div className="module-content">
        {activeModule === 'history' && <HistoryModule consultations={consultations} />}
        {activeModule === 'dictation' && <DictationModule token={token} backendUrl={backendUrl} patientId={patient.id} onConsultationAdded={handleNewConsultation} />}
        {activeModule === 'documents' && <DocumentModule token={token} backendUrl={backendUrl} patientId={patient.id} onConsultationAdded={handleNewConsultation} />}
      </div>
    </div>
  );
};

export default PatientWorkspace;
