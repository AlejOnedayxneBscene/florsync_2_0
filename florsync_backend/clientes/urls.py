from django.urls import path
from .views import ClienteListCreateView,  eliminar_cliente, editar_cliente, buscar_cliente_por_cedula
urlpatterns = [
    path('', ClienteListCreateView.as_view(), name='clientes'),
    path('<int:cedula>/editar/', editar_cliente, name='modificar_cliente'),
    path('<int:cedula>/eliminar/', eliminar_cliente, name='eliminar_cliente'),
    path('<int:cedula>/buscar/', buscar_cliente_por_cedula, name='buscar_cliente'),

]