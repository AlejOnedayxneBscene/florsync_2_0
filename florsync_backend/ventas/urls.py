from django.urls import path
from .views import realizar_venta, obtener_ventas

urlpatterns = [
    path('realizar-ventas/', realizar_venta, name='realizar_venta'),
    path('obtener_ventas/', obtener_ventas, name='obtener_ventas')
]
