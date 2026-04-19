from django.urls import path
from .views import dashboard, realizar_venta, obtener_ventas, dashboard, dashboard_admin

urlpatterns = [
    path('realizar-ventas/', realizar_venta, name='realizar_venta'),
    path('obtener_ventas/', obtener_ventas, name='obtener_ventas'),
    path("dashboard/", dashboard),
    path("dashboard-admin/", dashboard_admin, name="dashboard_admin"),  # 🔥 ESTA
]

