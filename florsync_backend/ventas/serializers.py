from rest_framework import serializers
from .models import Venta, DetalleVenta
from clientes.serializers import ClienteSerializer
from productos.serializers import ProductoSerializer

class DetalleVentaSerializer(serializers.ModelSerializer):
    producto = serializers.StringRelatedField()  # o usa producto.nombre si prefieres

    class Meta:
        model = DetalleVenta
        fields = ['producto', 'cantidad', 'precio', 'total']

class VentaSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer()
    detalles = DetalleVentaSerializer(many=True, read_only=True)

    class Meta:
        model = Venta
        fields = ['id_venta', 'cliente', 'fecha', 'total', 'detalles']

   
