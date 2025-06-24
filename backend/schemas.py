from pydantic import BaseModel
from datetime import date, datetime

# --- Schémas pour les Consultations ---
class ConsultationBase(BaseModel):
    type: str
    content: str

class ConsultationCreate(ConsultationBase):
    pass

class Consultation(ConsultationBase):
    id: int
    creation_date: datetime
    patient_id: int

    class Config:
        from_attributes = True


# --- Schémas pour les Patients (mis à jour) ---
class PatientBase(BaseModel):
    nom: str
    prenom: str
    date_naissance: date | None = None

class PatientCreate(PatientBase):
    pass

# On met à jour le schéma Patient pour qu'il inclue la liste de ses consultations
class Patient(PatientBase):
    id: int
    medecin_id: int
    consultations: list[Consultation] = [] # La liste des consultations associées

    class Config:
        from_attributes = True


# --- Schémas pour l'Authentification (mis à jour) ---
class MedecinCreate(BaseModel):
    email: str
    password: str

# On met à jour le schéma Medecin pour qu'il inclue la liste de ses patients
class Medecin(BaseModel):
    id: int
    email: str
    patients: list[Patient] = []

    class Config:
        from_attributes = True


# --- Schémas pour les Tokens (inchangés) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
