import time

from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError


class Command(BaseCommand):
    """Espera a que la base de datos esté disponible antes de continuar."""

    help = 'Espera a que la base de datos acepte conexiones.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--timeout',
            type=int,
            default=30,
            help='Segundos máximos a esperar antes de fallar.',
        )

    def handle(self, *args, **options):
        self.stdout.write('Esperando conexión a la base de datos...')
        timeout = options['timeout']
        intentos = 0
        max_intentos = timeout  # 1 intento por segundo

        while intentos < max_intentos:
            try:
                connections['default'].cursor()
                self.stdout.write(self.style.SUCCESS('Base de datos disponible.'))
                return
            except OperationalError:
                intentos += 1
                self.stdout.write(
                    f'Base de datos no disponible aún, reintentando... '
                    f'({intentos}/{max_intentos})'
                )
                time.sleep(1)

        self.stderr.write(
            self.style.ERROR(
                f'No se pudo conectar a la base de datos tras {timeout}s.'
            )
        )
        raise SystemExit(1)
