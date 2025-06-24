from sqlalchemy import create_engine, Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship, declarative_base

# 1. Configuration de la base de données
# On utilise SQLite. La base de données sera un simple fichier nommé 'cabinet.db'
# dans notre dossier backend.
DATABASE_URL = "sqlite:///./cabinet.db"

# L'engine est le point d'entrée principal pour communiquer avec la base de données.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# La session est l'intermédiaire pour toutes nos conversations avec la base de données.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# C'est la classe de base que nos modèles (tables) utiliseront.
Base = declarative_base()


# 2. Définition de nos modèles (nos tables)

class Medecin(Base):
    __tablename__ = "medecins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Cette ligne crée la relation : un médecin peut avoir plusieurs patients.
    patients = relationship("Patient", back_populates="medecin")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, index=True, nullable=False)
    prenom = Column(String, index=True, nullable=False)
    date_naissance = Column(Date)
    
    # C'est la clé étrangère : elle lie un patient à un médecin spécifique.
    medecin_id = Column(Integer, ForeignKey("medecins.id"))
    
    # Crée la relation inverse : un patient appartient à un seul médecin.
    medecin = relationship("Medecin", back_populates="patients")


# --- Fonction pour créer la base de données et les tables ---
def create_database_and_tables():
    print("Création de la base de données et des tables si elles n'existent pas...")
    Base.metadata.create_all(bind=engine)
    print("Terminé.")

# Cette partie permet d'exécuter la création en lançant le fichier directement
if __name__ == "__main__":
    create_database_and_tables()
from sqlalchemy import create_engine, Column, Integer, String, Date, ForeignKey, Text, DateTime
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from datetime import datetime, timezone

# 1. Configuration de la base de données (inchangée)
DATABASE_URL = "sqlite:///./cabinet.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# 2. Définition de nos modèles (nos tables)

class Medecin(Base):
    __tablename__ = "medecins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # On ajoute 'cascade' pour que la suppression d'un médecin supprime ses patients.
    patients = relationship("Patient", back_populates="medecin", cascade="all, delete-orphan")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, index=True, nullable=False)
    prenom = Column(String, index=True, nullable=False)
    date_naissance = Column(Date)
    
    medecin_id = Column(Integer, ForeignKey("medecins.id"))
    medecin = relationship("Medecin", back_populates="patients")

    # NOUVEAU: Relation vers la table des consultations
    consultations = relationship("Consultation", back_populates="patient", cascade="all, delete-orphan")

# NOUVEAU: La table pour stocker chaque consultation ou document analysé
class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True) # 'dictation' ou 'document'
    content = Column(Text, nullable=False)
    creation_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    patient = relationship("Patient", back_populates="consultations")


# --- Fonction pour créer la base de données et les tables ---
def create_database_and_tables():
    print("Création/vérification des tables de la base de données...")
    Base.metadata.create_all(bind=engine)
    print("Terminé.")
