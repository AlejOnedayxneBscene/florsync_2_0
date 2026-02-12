from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Clientes
from .serializers import ClienteSerializer
from rest_framework import generics
from rest_framework.generics import ListCreateAPIView
from rest_framework import status
# Listar clientes activos
@api_view(['GET'])
@permission_classes([AllowAny])
def listar_clientes(request):
    clientes = Clientes.objects.filter(activo=True)
    serializer = ClienteSerializer(clientes, many=True)
    return Response(serializer.data)

@permission_classes([AllowAny])
class ClienteListCreateView(ListCreateAPIView):
    queryset = Clientes.objects.filter(activo=True)
    serializer_class = ClienteSerializer

    def create(self, request, *args, **kwargs):
        cedula = request.data.get("cedula")
        if not cedula:
            return Response({"error": "La cédula es obligatoria"}, status=status.HTTP_400_BAD_REQUEST)

        # Revisar si existe un cliente con la cédula
        cliente_existente = Clientes.objects.filter(cedula=cedula).first()
        if cliente_existente:
            if not cliente_existente.activo:
                # Reactivar el cliente desactivado
                cliente_existente.nombre_cliente = request.data.get("nombre_cliente", cliente_existente.nombre_cliente)
                cliente_existente.direccion = request.data.get("direccion", cliente_existente.direccion)
                cliente_existente.telefono = request.data.get("telefono", cliente_existente.telefono)
                cliente_existente.correo = request.data.get("correo", cliente_existente.correo)
                cliente_existente.activo = True
                cliente_existente.save()
                serializer = ClienteSerializer(cliente_existente)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Ya existe un cliente activo con esa cédula"}, status=status.HTTP_400_BAD_REQUEST)

        # Crear un cliente nuevo si no existe
        serializer = ClienteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Editar cliente
@api_view(['PUT'])
@permission_classes([AllowAny])
def editar_cliente(request, cedula):
    cliente = get_object_or_404(Clientes, cedula=cedula, activo=True)

    # Actualizamos solo los campos existentes
    cliente.nombre_cliente = request.data.get("nombre_cliente", cliente.nombre_cliente)
    cliente.correo = request.data.get("correo", cliente.correo)
    cliente.telefono = request.data.get("telefono", cliente.telefono)
    cliente.direccion = request.data.get("direccion", cliente.direccion)
    
    cliente.save()

    return Response({"mensaje": "Cliente actualizado"})

# Eliminar cliente (lógico)
@api_view(['DELETE'])
@permission_classes([AllowAny])
def eliminar_cliente(request, cedula):
    cliente = get_object_or_404(Clientes, cedula=cedula)
    cliente.activo = False
    cliente.save()
    return Response({"mensaje": "Cliente ocultado"})



@api_view(["GET"])
def buscar_cliente_por_cedula(request, cedula):
    try:
        cliente = Clientes.objects.get(cedula=cedula)
        serializer = ClienteSerializer(cliente)
        return Response(serializer.data)
    except Clientes.DoesNotExist:
        return Response({"detail": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)