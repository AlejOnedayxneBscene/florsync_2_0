from rest_framework import serializers
from .models import Usuarios
from .models import Venta, DetalleVenta
from .models import Reporte

class ReporteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reporte
        fields = '__all__'


class DetalleVentaSerializer(serializers.ModelSerializer):
    #producto = serializers.StringRelatedField()  # o usa producto.nombre si prefieres

    class Meta:
        model = DetalleVenta
        fields = ['producto', 'cantidad', 'precio', 'total']

class VentaSerializer(serializers.ModelSerializer):
    #cliente = ClienteSerializer()
    detalles = DetalleVentaSerializer(many=True, read_only=True)

    class Meta:
        model = Venta
        #fields = ['id_venta', 'cliente', 'fecha', 'total', 'detalles']

   

class UsuariosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuarios
        fields = '__all__' 
 

        
from rest_framework import serializers
from .models import Categoria

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = "__all__"
