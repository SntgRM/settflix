#!/bin/sh
set -e

echo "==> Esperando base de datos..."
python manage.py wait_for_db

echo "==> Aplicando migraciones..."
python manage.py migrate --noinput

# Crea un usuario de prueba automáticamente si se definieron las variables
# DJANGO_SUPERUSER_USERNAME / DJANGO_SUPERUSER_PASSWORD (útil solo para
# probar el login rápido en local; en un entorno real no se haría así).
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  echo "==> Verificando usuario de prueba '$DJANGO_SUPERUSER_USERNAME'..."
  python manage.py shell -c "
from django.contrib.auth.models import User
username = '$DJANGO_SUPERUSER_USERNAME'
password = '$DJANGO_SUPERUSER_PASSWORD'
email = '${DJANGO_SUPERUSER_EMAIL:-admin@example.com}'
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f'Usuario {username} creado.')
else:
    print(f'Usuario {username} ya existe.')
"
fi

echo "==> Levantando servidor Django en 0.0.0.0:8000..."
exec python manage.py runserver 0.0.0.0:8000
