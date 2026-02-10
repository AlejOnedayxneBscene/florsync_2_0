from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Producto
from .serializers import ProductoSerializer

@api_view(['GET'])
def listar_productos(request):
    productos = Producto.objects.filter(activo=True)
    serializer = ProductoSerializer(productos, many=True)
    return Response(serializer.data)

class ProductoListCreateView(generics.ListCreateAPIView):
    queryset = Producto.objects.filter(activo=True)
    serializer_class = ProductoSerializer

@api_view(['PUT'])
def editar_producto(request, id):
    producto = get_object_or_404(Producto, id_producto=id, activo=True)

    producto.nombre = request.data.get("nombre")
    producto.precio = request.data.get("precio")
    producto.categoria_id = request.data.get("categoria")
    producto.cantidad = request.data.get("cantidad")
    producto.stock_total = request.data.get("stock_total")
    producto.stock_minimo = request.data.get("stock_minimo")

    producto.save()

    return Response({"mensaje": "Producto actualizado"})


@api_view(['DELETE'])
def eliminar_producto(request, id):
    producto = get_object_or_404(Producto, id_producto=id)
    producto.activo = False
    producto.save()

    return Response({"mensaje": "Producto ocultado"})
