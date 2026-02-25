# auditoria/views.py

from rest_framework.viewsets import ReadOnlyModelViewSet
from .models import AuditLog
from .serializers import AuditLogSerializer
from rest_framework.permissions import IsAuthenticated

class AuditLogViewSet(ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("usuario").all().order_by("-fecha")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]