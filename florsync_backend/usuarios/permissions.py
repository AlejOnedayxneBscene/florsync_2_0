from rest_framework.permissions import BasePermission


class EsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.groups.filter(
                name="Administrador"
            ).exists()
        )



class EsAdminOVendedor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.groups.filter(
                name__in=["Administrador", "Vendedor"]
            ).exists()
        )
