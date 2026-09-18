from rest_framework import serializers
from .models import Favorita

class FavoritaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Favorita
        fields = [
            'id',
            'id_pelicula',
            'titulo',
            'anio',
            'poster',
            'nota',
            'fecha_agregado',
        ]
        read_only_fields = ['id', 'fecha_agregado']

    def validate_nota(self, value):
        if value is not None and not (1 <= value <= 10):
            raise serializers.ValidationError('La nota debe estar entre 1 y 10.')
        return value

    def validate_id_pelicula(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('id_pelicula es obligatorio.')
        return value


class FavoritaUpdateSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Favorita
        fields = ['id', 'nota']
        read_only_fields = ['id']

    def validate_nota(self, value):
        if value is not None and not (1 <= value <= 10):
            raise serializers.ValidationError('La nota debe estar entre 1 y 10.')
        return value