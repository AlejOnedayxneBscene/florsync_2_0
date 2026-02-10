from django.urls import path
from .views import obtener_usuarios, login_usuario, registrar_producto, obtener_productos, visualizar_cliente
from .views import registrar_cliente, obtener_productoId, modificar_producto, modificar_clientes,obtener_clientesId
from .views import eliminar_clientes, eliminar_producto, realizar_venta,obtener_clientes, obtener_ventas, obtener_informe

from .views import CategoriaListCreateView, eliminar_categoria, editar_categoria
urlpatterns = [
    path('registrar-cliente/',registrar_cliente, name='registrar_cliente'),
    path('visualizar-cliente/', visualizar_cliente, name='visualizar_cliente'),
    path('obtener-clientesID/<int:id>/', obtener_clientesId, name='obtener_clientesId'),
    path('modificar-clientes/<int:id>/', modificar_clientes, name='modificar_clientes'),
    path('clientes-eliminar/<int:id>/', eliminar_clientes, name='eliminar_clientes'),
    path('realizar-ventas/', realizar_venta, name='realizar_venta'),
    path('clientes-obtener/', obtener_clientes, name='obtener_clientes'),
    path('ventas-visualizar/', obtener_ventas, name='ventas_visualizar'),
    path('informe/<str:tipo>/', obtener_informe, name='obtener-informe'),
    path("categorias/", CategoriaListCreateView.as_view(), name="categorias"),
   path("categorias/<int:id>/editar/", editar_categoria),
    path("categorias/<int:id>/eliminar/", eliminar_categoria),


        
]
