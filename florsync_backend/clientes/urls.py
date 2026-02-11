from django.urls import path
from .views import ClienteListCreateView,  eliminar_cliente, editar_cliente
urlpatterns = [
    path('', ClienteListCreateView.as_view(), name='clientes'),
    path('<int:cedula>/editar/', editar_cliente, name='modificar_cliente'),
    path('<int:cedula>/eliminar/', eliminar_cliente, name='eliminar_cliente'),
]