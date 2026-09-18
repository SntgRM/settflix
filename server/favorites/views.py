from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import IntegrityError
from .models import Favorita
from .serializers import FavoritaSerializer, FavoritaUpdateSerializer

class FavoritaListCreateView(generics.ListCreateAPIView):
    
    serializer_class = FavoritaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorita.objects.filter(usuario=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            serializer.save(usuario=request.user)
        except IntegrityError:
            return Response(
                {'error': 'Esta película ya está en tus favoritas.'},
                status=status.HTTP_409_CONFLICT
            )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

class FavoritaDetailView(generics.RetrieveUpdateDestroyAPIView):
    
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorita.objects.filter(usuario=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return FavoritaUpdateSerializer
        return FavoritaSerializer