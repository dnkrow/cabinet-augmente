from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from jose import JWTError, jwt
from typing import List
import shutil
import os
import requests
from dotenv import load_dotenv
import fitz

# On importe nos modules
import database, schemas, auth

# --- Configuration ---
database.create_database_and_tables()
load_dotenv()
HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")
WHISPER_API_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"
SUMMARY_API_URL = "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6"

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/medecins/login")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Fonctions de sécurité ---
def get_user_from_token(db: Session, token: str):
    """Décode un token JWT et retourne l'utilisateur correspondant."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(database.Medecin).filter(database.Medecin.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Dépendance standard pour obtenir l'utilisateur (utilisée pour les routes simples)."""
    return get_user_from_token(db, token)

# --- Fonctions Helper ---
def save_consultation(db: Session, patient_id: int, type: str, content: str) -> database.Consultation:
    db_consultation = database.Consultation(type=type, content=content, patient_id=patient_id)
    db.add(db_consultation)
    db.commit()
    db.refresh(db_consultation)
    return db_consultation


# --- Endpoints ---
@app.get("/")
def read_root(): return {"Project": "Cabinet Médical Augmenté - Backend"}

# --- AUTHENTIFICATION ---
@app.post("/api/medecins/signup", response_model=schemas.Medecin, tags=["Authentification"])
def create_medecin(medecin: schemas.MedecinCreate, db: Session = Depends(get_db)):
    db_medecin = db.query(database.Medecin).filter(database.Medecin.email == medecin.email).first()
    if db_medecin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email est déjà utilisé")
    hashed_password = auth.get_password_hash(medecin.password)
    new_medecin = database.Medecin(email=medecin.email, hashed_password=hashed_password)
    db.add(new_medecin)
    db.commit()
    db.refresh(new_medecin)
    return new_medecin

@app.post("/api/medecins/login", response_model=schemas.Token, tags=["Authentification"])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(database.Medecin).filter(database.Medecin.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- PATIENTS ---
@app.post("/api/patients", response_model=schemas.Patient, tags=["Patients"])
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db), current_medecin: schemas.Medecin = Depends(get_current_user)):
    db_patient = database.Patient(**patient.model_dump(), medecin_id=current_medecin.id)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.get("/api/patients", response_model=List[schemas.Patient], tags=["Patients"])
def read_patients(db: Session = Depends(get_db), current_medecin: schemas.Medecin = Depends(get_current_user)):
    return db.query(database.Patient).filter(database.Patient.medecin_id == current_medecin.id).all()

# --- NOUVEL ENDPOINT DE TEST ---
@app.post("/api/document/test_auth/{patient_id}", tags=["Tests"])
async def handle_document_auth_test(
    patient_id: int, 
    current_medecin: schemas.Medecin = Depends(get_current_user)
):
    """Teste l'authentification sur une route POST protégée sans envoi de fichier."""
    return {"status": "success", "message": f"Test d'authentification pour le document du patient {patient_id} réussi par {current_medecin.email}"}

# --- MODULES IA ---
@app.post("/api/dictation/{patient_id}", response_model=schemas.Consultation, tags=["IA Modules"])
async def handle_dictation(request: Request, patient_id: int, audioFile: UploadFile = File(...), db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant ou invalide")
    token = auth_header.split(" ")[1]
    current_medecin = get_user_from_token(db, token)

    temp_file_path = f"temp_{audioFile.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(audioFile.file, buffer)
    try:
        headers = {"Authorization": f"Bearer {HUGGING_FACE_TOKEN}", "Content-Type": audioFile.content_type}
        with open(temp_file_path, "rb") as audio_data:
            response = requests.post(WHISPER_API_URL, headers=headers, data=audio_data)
        if response.status_code == 200:
            result_text = response.json().get("text", "Erreur de transcription.")
            new_consultation = save_consultation(db, patient_id=patient_id, type="dictation", content=result_text)
            return new_consultation
        else:
            raise HTTPException(status_code=response.status_code, detail=f"Erreur API Transcription: {response.text}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/api/document/{patient_id}", response_model=schemas.Consultation, tags=["IA Modules"])
async def handle_document(request: Request, patient_id: int, documentFile: UploadFile = File(...), db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant ou invalide")
    token = auth_header.split(" ")[1]
    current_medecin = get_user_from_token(db, token)

    temp_file_path = f"temp_{documentFile.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(documentFile.file, buffer)
    try:
        doc = fitz.open(temp_file_path)
        full_text = "".join(page.get_text() for page in doc)
        doc.close()
        
        payload = {"inputs": full_text[:1024]}
        headers = {"Authorization": f"Bearer {HUGGING_FACE_TOKEN}"}
        response = requests.post(SUMMARY_API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            summary_text = response.json()[0].get('summary_text', "Erreur de résumé.")
            new_consultation = save_consultation(db, patient_id=patient_id, type="document", content=summary_text)
            return new_consultation
        else:
             raise HTTPException(status_code=response.status_code, detail=f"Erreur API Résumé: {response.text}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
