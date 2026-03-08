import os
from pathlib import Path

# Chemin de base du projet
BASE_DIR = Path(__file__).resolve().parent.parent

# SÉCURITÉ : Garde cette clé secrète en production !
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-v1vbvsl!v7d#^cjy$rrp!#!$4))nrrr6&9=n6m4x5i8#or=kz4')

# SÉCURITÉ : Ne pas laisser DEBUG=True en production
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# MODIFICATION : Autoriser toutes les IP pour que l'app soit visible sur AWS
ALLOWED_HOSTS = ['*']

# Applications installées
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Tes applications
    'accounts.apps.AccountsConfig',
    'meals.apps.MealsConfig',
    'workouts.apps.WorkoutsConfig',
    'nutrition.apps.NutritionConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'nutritrack.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'nutritrack.wsgi.application'


# MODIFICATION : On utilise SQLite temporairement pour le déploiement AWS
# Cela évite que l'application crash car elle ne trouve pas le container Postgres sur AWS.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Validation des mots de passe
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# Internationalisation
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Fichiers statiques (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles' # Requis pour la production/Docker

STATICFILES_DIRS = [
    BASE_DIR / 'accounts' / 'static',
    BASE_DIR / 'meals' / 'static',
    BASE_DIR / 'workouts' / 'static',
    BASE_DIR / 'nutrition' / 'static',
]

# Configuration par défaut des clés primaires
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Paramètres d'authentification
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/meals/'