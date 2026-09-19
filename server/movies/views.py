from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .services import buscar_peliculas, OMDbServiceError

class MovieSearchView(APIView):
    
    permission_classes = [IsAuthenticated]

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
        except (TypeError, ValueError):
            return Response(
                {
                    'error':
                    'El parámetro "page" debe ser un número entero.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not 1 <= page <= 100:
            return Response(
                {
                    'error':
                    'El parámetro "page" debe estar entre 1 y 100.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            data = buscar_peliculas(query, page)

        except OMDbServiceError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY
            )

        return Response(
            data,
            status=status.HTTP_200_OK
        )