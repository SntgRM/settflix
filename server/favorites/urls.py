from django.urls import path
from .views import FavoritaListCreateView, FavoritaDetailView

urlpatterns = [
    path('', FavoritaListCreateView.as_view()),
    path('<int:pk>/', FavoritaDetailView.as_view()),
]