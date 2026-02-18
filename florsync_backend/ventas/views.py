from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.shortcuts import get_object_or_404

from usuarios.permissions import EsAdminOVendedor

from .models import Venta, DetalleVenta
from productos.models import Producto
from clientes.models import Clientes


# =============================
# REALIZAR VENTA
# =============================
@api_view(["POST"])
@permission_classes([EsAdminOVendedor])  # 🔥 SOLO ADMIN Y VENDEDOR
@transaction.atomic
def realizar_venta(request):
    try:

        data = request.data
        cliente_data = data.get("cliente")
        productos = data.get("productos", [])

        if not productos:
            return Response(
                {"error": "Debe incluir al menos un producto"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cliente = None

        # -------------------------
        # PROCESAR CLIENTE
        # -------------------------
        if cliente_data:

            if isinstance(cliente_data, int):
                cliente = get_object_or_404(
                    Clientes,
                    id_cliente=cliente_data
                )

            elif isinstance(cliente_data, dict):
                cedula = cliente_data.get("cedula")

                if cedula:
                    cliente, created = Clientes.objects.get_or_create(
                        cedula=cedula,
                        defaults={
                            "nombre_cliente": cliente_data.get("nombre_cliente", ""),
                            "telefono": cliente_data.get("telefono", ""),
                            "correo": cliente_data.get("correo", ""),
                        },
                    )

                    if not created:
                        cliente.compras += 1
                        cliente.save()

        # -------------------------
        # CREAR VENTA
        # -------------------------
        venta = Venta.objects.create(
            cliente=cliente,
            usuario=request.user
        )

        total_venta = 0

        # -------------------------
        # PRODUCTOS
        # -------------------------
        for item in productos:

            id_producto = int(item.get("id_producto"))
            cantidad = int(item.get("cantidad", 0))

            if cantidad <= 0:
                return Response(
                    {"error": "Cantidad inválida"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            producto = get_object_or_404(
                Producto,
                id_producto=id_producto
            )

            if producto.stock_total < cantidad:
                return Response(
                    {"error": f"Stock insuficiente para {producto.nombre}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            producto.stock_total -= cantidad
            producto.save()

            detalle = DetalleVenta.objects.create(
                venta=venta,
                producto=producto,
                cantidad=cantidad,
                precio=producto.precio,
            )

            total_venta += detalle.subtotal()

        venta.total = total_venta
        venta.save()

        return Response(
            {"mensaje": "Venta registrada exitosamente"},
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# =============================
# OBTENER VENTAS
# =============================
@api_view(["GET"])
@permission_classes([EsAdminOVendedor])  # 🔥 SOLO ROLES PERMITIDOS
def obtener_ventas(request):

    fecha = request.query_params.get("fecha")
    user = request.user

    ventas = Venta.objects.all().select_related("cliente", "usuario")

    if fecha:
        ventas = ventas.filter(fecha__date=fecha)

    # admin ve todo
    if not user.groups.filter(name="Administrador").exists():
        ventas = ventas.filter(usuario=user)

    data = []

    for venta in ventas:

        detalles_data = [
            {
                "producto": d.producto.nombre,
                "cantidad": d.cantidad,
                "precio": d.precio,
                "total": d.subtotal(),
            }
            for d in venta.detalles.all()
        ]

        data.append({
            "id_venta": venta.id_venta,
            "fecha": venta.fecha,
            "total": venta.total,
            "cliente": {
                "nombre_cliente": venta.cliente.nombre_cliente
                if venta.cliente else "Anónimo",
                "cedula": venta.cliente.cedula if venta.cliente else None,
                "telefono": venta.cliente.telefono if venta.cliente else None,
                "correo": venta.cliente.correo if venta.cliente else None,
                "direccion": venta.cliente.direccion if venta.cliente else None,
            },
            "detalles": detalles_data,
            "usuario": {
                "id": venta.usuario.id,
                "nombre": venta.usuario.username
            } if venta.usuario else None,
        })

    return Response(data)
