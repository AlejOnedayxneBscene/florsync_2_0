from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied
from .models import Producto
from .serializers import ProductoSerializer
from usuarios.permissions import EsAdmin, EsAdminOVendedor


class ProductoViewSet(ModelViewSet):
    serializer_class = ProductoSerializer
    queryset = Producto.objects.filter(activo=True)

    # 🔥 permisos por acción
    def get_permissions(self):

        # solo admin puede crear/editar/eliminar
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [EsAdmin()]

        # vendedor solo ve
        return [EsAdminOVendedor()]

    # 🔥 eliminación lógica
    def perform_destroy(self, instance):
        instance.activo = False
        instance.save()
