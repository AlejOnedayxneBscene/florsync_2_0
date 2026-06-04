from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Count
from django.db.models.functions import TruncDate, TruncHour, TruncMonth
from django.utils.timezone import localdate
from datetime import timedelta
from dateutil.relativedelta import relativedelta

from usuarios.permissions import EsAdminOVendedor
from .models import Venta, DetalleVenta
from productos.models import Producto
from clientes.models import Clientes


# ─────────────────────────────────────────
# REALIZAR VENTA
# ─────────────────────────────────────────
@api_view(["POST"])
@permission_classes([EsAdminOVendedor])
@transaction.atomic
def realizar_venta(request):
    try:
        data = request.data
        cliente_data = data.get("cliente")
        productos = data.get("productos", [])
        metodo_pago = data.get("metodo_pago", "efectivo")
        efectivo_recibido = data.get("efectivo_recibido")

        if not productos:
            return Response(
                {"error": "Debe incluir al menos un producto"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cliente = None

        if cliente_data:
            if isinstance(cliente_data, int):
                cliente = get_object_or_404(Clientes, id_cliente=cliente_data)

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

        # Primero validar TODO antes de crear la venta
        items_validados = []
        for item in productos:
            id_producto = int(item.get("id_producto"))
            cantidad = int(item.get("cantidad", 0))

            if cantidad <= 0:
                return Response(
                    {"error": "Cantidad inválida"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            producto = get_object_or_404(Producto, id_producto=id_producto)

            if producto.stock_total < cantidad:
                return Response(
                    {"error": f"Stock insuficiente para {producto.nombre}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            items_validados.append((producto, cantidad))

        # Solo crear la venta si todo está bien
        venta = Venta.objects.create(
            cliente=cliente,
            usuario=request.user,
            metodo_pago=metodo_pago,
            efectivo_recibido=efectivo_recibido if metodo_pago == "efectivo" else None,
        )

        total_venta = 0

        for producto, cantidad in items_validados:
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


# ─────────────────────────────────────────
# OBTENER VENTAS
# ─────────────────────────────────────────
@api_view(["GET"])
@permission_classes([EsAdminOVendedor])
def obtener_ventas(request):
    fecha = request.query_params.get("fecha")
    user = request.user

    ventas = Venta.objects.all().select_related("cliente", "usuario")

    if fecha:
        ventas = ventas.filter(fecha__date=fecha)

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
            "metodo_pago": venta.metodo_pago,
            "efectivo_recibido": venta.efectivo_recibido,
            "cliente": {
                "nombre_cliente": venta.cliente.nombre_cliente if venta.cliente else "Anónimo",
                "cedula": venta.cliente.cedula if venta.cliente else None,
                "telefono": venta.cliente.telefono if venta.cliente else None,
                "correo": venta.cliente.correo if venta.cliente else None,
                "direccion": venta.cliente.direccion if venta.cliente else None,
            },
            "detalles": detalles_data,
            "usuario": {
                "id": venta.usuario.id,
                "nombre": venta.usuario.username,
            } if venta.usuario else None,
        })

    return Response(data)


# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────
def _calcular_rango(view, offset):
    """
    Devuelve (start, end) del período seleccionado (1 día / 1 semana / 1 mes).
    Para vista month, start/end cubren solo ESE mes — el gráfico extenderá
    el rango a 12 meses internamente.
    """
    today = localdate()

    if view == "day":
        start = today + timedelta(days=offset)
        end = start

    elif view == "week":
        start = (today - timedelta(days=today.weekday())) + timedelta(weeks=offset)
        end = start + timedelta(days=6)

    elif view == "month":
        first_of_month = today.replace(day=1)
        start = first_of_month + relativedelta(months=offset)
        end = start + relativedelta(months=1) - timedelta(days=1)

    else:
        start = (today - timedelta(days=today.weekday())) + timedelta(weeks=offset)
        end = start + timedelta(days=6)

    return start, end


def generar_chart_data(ventas_qs, view, start, end):
    """
    Genera puntos para el gráfico.
    - day   → 24 puntos (horas)
    - week  → 7 puntos (días)
    - month → 12 puntos (meses), extiende el rango internamente
    """

    if view == "day":
        hourly = (
            ventas_qs
            .annotate(hour=TruncHour("fecha"))
            .values("hour")
            .annotate(total_sales=Sum("total"), total_orders=Count("id_venta"))
        )
        hour_map = {item["hour"].strftime("%H:00"): item for item in hourly}
        return [
            {
                "date": f"{h:02d}:00",
                "total_sales": float(hour_map.get(f"{h:02d}:00", {}).get("total_sales") or 0),
                "total_orders": hour_map.get(f"{h:02d}:00", {}).get("total_orders") or 0,
            }
            for h in range(24)
        ]

    elif view == "week":
        daily = (
            ventas_qs
            .annotate(day=TruncDate("fecha"))
            .values("day")
            .annotate(total_sales=Sum("total"), total_orders=Count("id_venta"))
        )
        daily_map = {str(d["day"]): d for d in daily}
        return [
            {
                "date": (start + timedelta(days=i)).strftime("%Y-%m-%d"),
                "total_sales": float(daily_map.get(str(start + timedelta(days=i)), {}).get("total_sales") or 0),
                "total_orders": daily_map.get(str(start + timedelta(days=i)), {}).get("total_orders") or 0,
            }
            for i in range(7)
        ]

    elif view == "month":
        # Extender el queryset a los 12 meses anteriores al mes seleccionado
        chart_start = start + relativedelta(months=-11)
        qs_extendido = ventas_qs.filter(
            fecha__date__gte=chart_start,
            fecha__date__lte=end,
        )
        monthly = (
            qs_extendido
            .annotate(month=TruncMonth("fecha"))
            .values("month")
            .annotate(total_sales=Sum("total"), total_orders=Count("id_venta"))
            .order_by("month")
        )
        month_map = {item["month"].strftime("%Y-%m"): item for item in monthly}

        # Generar los 12 meses aunque estén vacíos
        return [
            {
                "date": (chart_start + relativedelta(months=i)).strftime("%Y-%m"),
                "total_sales": float(month_map.get(
                    (chart_start + relativedelta(months=i)).strftime("%Y-%m"), {}
                ).get("total_sales") or 0),
                "total_orders": month_map.get(
                    (chart_start + relativedelta(months=i)).strftime("%Y-%m"), {}
                ).get("total_orders") or 0,
            }
            for i in range(12)
        ]

    return []


# ─────────────────────────────────────────
# DASHBOARD (vendedor)
# ─────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    view = request.GET.get("view", "week")
    offset = int(request.GET.get("offset", 0))

    start, end = _calcular_rango(view, offset)

    # QS del período seleccionado (para summary y top_products)
    ventas_qs = Venta.objects.filter(
        usuario=request.user,
        fecha__date__gte=start,
        fecha__date__lte=end,
    )

    # El gráfico recibe el QS base; generar_chart_data extiende a 12 meses internamente
    chart_data = generar_chart_data(
        Venta.objects.filter(usuario=request.user),
        view, start, end,
    )

    totals = ventas_qs.aggregate(
        total_orders=Count("id_venta"),
        total_sales=Sum("total"),
    )

    top_products = list(
        DetalleVenta.objects
        .filter(venta__in=ventas_qs)
        .values("producto__nombre")
        .annotate(
            total_vendido=Sum("cantidad"),
            total_ingresos=Sum(
                ExpressionWrapper(F("cantidad") * F("precio"), output_field=DecimalField())
            ),
        )
        .order_by("-total_vendido")[:5]
    )

    return Response({
        "summary": {
            "total_orders": totals["total_orders"] or 0,
            "total_sales": float(totals["total_sales"] or 0),
        },
        "chart_data": chart_data,
        "period": {"start": str(start), "end": str(end)},
        "top_products": [
            {
                "nombre": item["producto__nombre"],
                "total_vendido": item["total_vendido"],
                "total_ingresos": float(item["total_ingresos"] or 0),
            }
            for item in top_products
        ],
    })


# ─────────────────────────────────────────
# DASHBOARD ADMIN
# ─────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_admin(request):
    view = request.GET.get("view", "week")
    offset = int(request.GET.get("offset", 0))

    start, end = _calcular_rango(view, offset)

    # QS del período seleccionado (summary, top_products, top_sellers)
    ventas_qs = Venta.objects.filter(
        fecha__date__gte=start,
        fecha__date__lte=end,
    )

    # El gráfico recibe el QS sin filtro de fechas; generar_chart_data lo extiende
    chart_data = generar_chart_data(
        Venta.objects.all(),
        view, start, end,
    )

    totals = ventas_qs.aggregate(
        total_orders=Count("id_venta"),
        total_sales=Sum("total"),
    )

    top_sellers = list(
        ventas_qs
        .filter(usuario__isnull=False)
        .values("usuario__id", "usuario__username")
        .annotate(
            total_sales=Sum("total"),
            total_orders=Count("id_venta"),
        )
        .order_by("-total_sales")[:5]
    )

    top_products = list(
        DetalleVenta.objects
        .filter(venta__in=ventas_qs)
        .values("producto__nombre")
        .annotate(
            total_vendido=Sum("cantidad"),
            total_ingresos=Sum(
                ExpressionWrapper(F("cantidad") * F("precio"), output_field=DecimalField())
            ),
        )
        .order_by("-total_vendido")[:5]
    )

    productos_bajo_stock = list(
        Producto.objects
        .filter(stock_total__lte=F("stock_minimo"))
        .values("id_producto", "nombre", "stock_total", "stock_minimo")
    )

    return Response({
        "summary": {
            "total_orders": totals["total_orders"] or 0,
            "total_sales": float(totals["total_sales"] or 0),
        },
        "chart_data": chart_data,
        "period": {"start": str(start), "end": str(end)},
        "top_products": [
            {
                "nombre": item["producto__nombre"],
                "total_vendido": item["total_vendido"],
                "total_ingresos": float(item["total_ingresos"] or 0),
            }
            for item in top_products
        ],
        "top_sellers": [
            {
                "id": item["usuario__id"],
                "vendedor": item["usuario__username"],
                "total_sales": float(item["total_sales"] or 0),
                "total_orders": item["total_orders"],
            }
            for item in top_sellers
        ],
        "low_stock": [
            {
                "id": p["id_producto"],
                "nombre": p["nombre"],
                "stock": p["stock_total"],
                "stock_minimo": p["stock_minimo"],
            }
            for p in productos_bajo_stock
        ],
    })