from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Venta, DetalleVenta
from productos.models import Producto
from clientes.models import Clientes
from django.shortcuts import get_object_or_404

@api_view(['POST'])
@transaction.atomic
def realizar_venta(request):
    try:
        print("📥 [LOG] Datos recibidos:", request.data)

        data = request.data
        cliente_data = data.get("cliente")
        productos = data.get("productos", [])

        if not productos:
            return Response(
                {"error": "Debe incluir al menos un producto"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cliente = None

        # =========================
        # PROCESAR CLIENTE
        # =========================
        if cliente_data:
            cedula = cliente_data.get("cedula")

            if cedula:
                cliente, created = Clientes.objects.get_or_create(
                    cedula=cedula,
                    defaults={
                        "nombre_cliente": cliente_data.get("nombre_cliente", ""),
                        "telefono": cliente_data.get("telefono", ""),
                        "correo": cliente_data.get("correo", "")
                    }
                )

                if not created:
                    cliente.compras += 1
                    cliente.save()

                print(f"✅ Cliente: {cliente.nombre_cliente}")

        # =========================
        # CREAR VENTA
        # =========================
        venta = Venta.objects.create(cliente=cliente)

        total_venta = 0

        # =========================
        # PROCESAR PRODUCTOS
        # =========================
        for item in productos:
            id_producto = item.get("id_producto")
            cantidad = item.get("cantidad", 0)

            if not id_producto or cantidad <= 0:
                return Response(
                    {"error": "Producto inválido o cantidad no válida"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            producto = get_object_or_404(Producto, id_producto=id_producto)

            if producto.cantidad < cantidad:
                return Response(
                    {"error": f"Stock insuficiente para {producto.nombre}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Descontar stock
            producto.cantidad -= cantidad
            producto.save()

            # Crear detalle
            detalle = DetalleVenta.objects.create(
                venta=venta,
                producto=producto,
                cantidad=cantidad,
                precio=producto.precio  # Siempre usar precio actual del producto
            )

            total_venta += detalle.subtotal()

        # =========================
        # ACTUALIZAR TOTAL
        # =========================
        venta.total = total_venta
        venta.save()

        print("🎉 Venta registrada exitosamente")

        return Response(
            {"mensaje": "Venta registrada exitosamente"},
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        print(f"🔥 ERROR: {e}")
        return Response(
            {"error": f"Error al registrar la venta: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
