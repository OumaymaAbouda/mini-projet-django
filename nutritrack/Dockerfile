# 1. Utiliser une image Python officielle et légère
FROM python:3.10-slim

# 2. Définir des variables d'environnement pour Python
# Empêche la création de fichiers .pyc et assure que les logs s'affichent en temps réel
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Installer les dépendances système nécessaires pour PostgreSQL et Pillow
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# 4. Créer et définir le dossier de travail dans le conteneur
WORKDIR /app

# 5. Installer les dépendances Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copier tout le reste du code du projet
COPY . /app/

# 7. Exposer le port 8000
EXPOSE 8000

# 8. Commande par défaut (sera surchargée par docker-compose pour le développement)
# Remplace la dernière ligne par celle-ci (sh -c permet de chaîner les commandes)
CMD sh -c "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"