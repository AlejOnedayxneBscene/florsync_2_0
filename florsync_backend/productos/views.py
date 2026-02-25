from rest_framework.viewsets import ModelViewSet
from .models import Producto
from .serializers import ProductoSerializer
from usuarios.permissions import EsAdmin, EsAdminOVendedor
from auditoria.mixins import AuditMixin


class ProductoViewSet(AuditMixin, ModelViewSet):
    serializer_class = ProductoSerializer
    queryset = Producto.objects.filter(activo=True)

    # 🔥 permisos por acción
    def get_permissions(self):

        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [EsAdmin()]

        return [EsAdminOVendedor()]
