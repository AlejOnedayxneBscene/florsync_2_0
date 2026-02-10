from django.urls import path
from .views import ProductoListCreateView, editar_producto, eliminar_producto

urlpatterns = [
    path("", ProductoListCreateView.as_view(), name="productos"),  # <- ahora coincide con /productos/
    path("<int:id>/editar/", editar_producto, name="editar_producto"),
    path("<int:id>/eliminar/", eliminar_producto, name="eliminar_producto"),
]
