from django.db import models
from django.contrib.auth.models import User

class Favorita(models.Model):

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favoritas'
    )

    id_pelicula = models.CharField(
        max_length=20,
        help_text='Identificador de la película en la API externa (imdbID)'
    )

    titulo = models.CharField(max_length=255)

    anio = models.CharField(max_length=10, blank=True, null=True)

    poster = models.URLField(max_length=500, blank=True, null=True)

    nota = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
        help_text='Calificación personal, por ejemplo de 1 a 5'
    )

    fecha_agregado = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['usuario', 'id_pelicula'],
                name='unica_favorita_por_usuario'
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(nota__isnull=True) |
                    models.Q(nota__gte=1, nota__lte=5)
                ),
                name='nota_favorita_entre_1_y_5',
            ),
        ]
        ordering = ['-fecha_agregado']

    def __str__(self):
        return f'{self.titulo} ({self.usuario.username})'