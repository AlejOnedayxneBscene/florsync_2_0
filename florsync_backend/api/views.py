from rest_framework.viewsets import ModelViewSet
from .models import Categoria
from .serializers import CategoriaSerializer
from usuarios.permissions import EsAdmin, EsAdminOVendedor


class CategoriaViewSet(ModelViewSet):
    serializer_class = CategoriaSerializer
    queryset = Categoria.objects.filter(activo=True)

    def get_permissions(self):

        # solo admin modifica
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [EsAdmin()]

        # vendedor solo ve
        return [EsAdminOVendedor()]

    # eliminación lógica
    def perform_destroy(self, instance):
        instance.activo = False
        instance.save()
