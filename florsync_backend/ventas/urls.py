from django.urls import path
from .views import realizar_venta

urlpatterns = [
    path('realizar-ventas/', realizar_venta, name='realizar_venta'),

]
