import os
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

# --- Configuration de Sécurité ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Récupération de la clé secrète depuis le fichier .env
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Le token expirera après 60 minutes

# Vérification cruciale : on s'assure que la clé est bien chargée au démarrage.
if SECRET_KEY is None:
    raise EnvironmentError(
        "ERREUR CRITIQUE: La variable d'environnement SECRET_KEY n'est pas trouvée. "
        "Vérifiez qu'elle est bien présente dans votre fichier backend/.env"
    )

# --- Fonctions pour les Mots de Passe ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- Fonctions pour les Jetons JWT ---
def create_access_token(data: dict):
    """Crée un nouveau jeton d'accès JWT."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
