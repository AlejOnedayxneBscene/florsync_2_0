from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Usuarios
    path('api/usuarios/', include('usuarios.urls')),

    # API
    path('api/', include('api.url')),

    # JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Otros módulos
    path('api/productos/', include('productos.urls')),
    path('api/clientes/', include('clientes.urls')),
    path('api/ventas/', include('ventas.urls')),
    path('api/auditoria/', include('auditoria.urls')),
    
]