from rest_framework import serializers
from .models import Usuarios
from .models import Clientes
from .models import Producto
from .models import Venta, DetalleVenta, Producto
from .models import Reporte

class ReporteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reporte
        fields = '__all__'


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clientes
        fields = '__all__' 

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

   

class UsuariosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuarios
        fields = '__all__' 
 

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

        def create(self, validated_data):
            id_producto = validated_data.get('id_producto')

        # Verificar si el ID ya existe
            if Producto.objects.filter(id_producto=id_producto).exists():
                raise serializers.ValidationError({"id_producto": "Este ID ya existe. No se puede duplicar."})

            return super().create(validated_data)
        
