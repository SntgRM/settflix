from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .services import buscar_peliculas, OMDbServiceError


class MovieSearchView(APIView):
    
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        page_param = request.query_params.get('page', 1)

        if not query:
            return Response(
                {'error': 'El parámetro "q" es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            page = int(page_param)
            if page < 1:
                page = 1
        except (TypeError, ValueError):
            page = 1

        try:
            data = buscar_peliculas(query, page)
        except OMDbServiceError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_502_BAD_GATEWAY
            )

        return Response(data, status=status.HTTP_200_OK)