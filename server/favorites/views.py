from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import IntegrityError
from .models import Favorita
from .serializers import FavoritaSerializer, FavoritaUpdateSerializer
from movies.services import obtener_pelicula_por_id, OMDbServiceError, OMDbNotFoundError

ORDERING_FIELDS = {
    'fecha_agregado': 'fecha_agregado',
    '-fecha_agregado': '-fecha_agregado',
    'anio': 'anio',
    '-anio': '-anio',
    'nota': 'nota',
    '-nota': '-nota',
    'titulo': 'titulo',
    '-titulo': '-titulo',
}
DEFAULT_ORDERING = '-fecha_agregado'


class FavoritaListCreateView(generics.ListCreateAPIView):
    
    serializer_class = FavoritaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Favorita.objects.filter(usuario=self.request.user)
        params = self.request.query_params

        anio = params.get('anio')
        if anio:
            queryset = queryset.filter(anio=anio)

        nota_min = params.get('nota_min')
        if nota_min:
            try:
                queryset = queryset.filter(nota__gte=int(nota_min))
            except ValueError:
                pass

        nota_max = params.get('nota_max')
        if nota_max:
            try:
                queryset = queryset.filter(nota__lte=int(nota_max))
            except ValueError:
                pass

        ordering = ORDERING_FIELDS.get(params.get('ordering'), DEFAULT_ORDERING)
        return queryset.order_by(ordering)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        id_pelicula = serializer.validated_data['id_pelicula']

        try:
            pelicula = obtener_pelicula_por_id(id_pelicula)
        except OMDbNotFoundError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_404_NOT_FOUND
            )
        except OMDbServiceError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY
            )

        try:
            favorita = Favorita.objects.create(
                usuario=request.user,
                id_pelicula=pelicula['id_pelicula'],
                titulo=pelicula['titulo'],
                anio=pelicula['anio'],
                poster=pelicula['poster'],
                nota=serializer.validated_data.get('nota'),
            )
        except IntegrityError:
            return Response(
                {'error': 'Esta película ya está en tus favoritas.'},
                status=status.HTTP_409_CONFLICT
            )

        output_serializer = self.get_serializer(favorita)

        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED
        )

class FavoritaDetailView(generics.RetrieveUpdateDestroyAPIView):
    
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorita.objects.filter(usuario=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return FavoritaUpdateSerializer
        return FavoritaSerializer