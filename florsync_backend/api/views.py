from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Usuarios
from .models import Venta
from .models import DetalleVenta
from .models import Clientes, Producto
from .serializers import ClienteSerializer, ProductoSerializer
from .serializers import UsuariosSerializer
from rest_framework import status
from django.db import transaction
from django.shortcuts import get_object_or_404
from datetime import datetime
from django.utils import timezone
from .serializers import VentaSerializer
from datetime import datetime
from django.db.models import Sum

@api_view(['GET'])
def obtener_usuarios(request):
    usuarios = Usuarios.objects.all()
    serializer = UsuariosSerializer(usuarios, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def login_usuario(request):
    print("Datos recibidos en login:", request.data)  

    id_usuario = request.data.get("id_usuario")
    password = request.data.get("password")

    if not id_usuario or not password:
        return Response({"error": "Faltan datos"}, status=400)

    try:
        usuario = Usuarios.objects.get(id_usuario=id_usuario)
    except Usuarios.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=404)

    if usuario.verificar_contraseña(password):
        return Response({"autenticado": True, "id_usuario": usuario.id_usuario})
    else:
        return Response({"autenticado": False, "error": "Credenciales incorrectas"}, status=401)
    
@api_view(['POST'])
def registrar_cliente(request):
    print("Datos recibidos en Django:", request.data)  
    
    cedula = request.data.get("cedula", "").strip()
    direccion = request.data.get("direccion", "").strip()
    correo = request.data.get("correo", "").strip()
    nombre_cliente = request.data.get("nombre_cliente", "").strip()
    telefono = request.data.get("telefono", "").strip()
    if Clientes.objects.filter(cedula=cedula).exists():
            return Response({"error": "Esta cedula ya esta  registrada"}, status=status.HTTP_400_BAD_REQUEST)

    clientes = Clientes(
        cedula=cedula, 
        direccion=direccion if direccion else None,  
        correo=correo if correo else None,  
        nombre_cliente=nombre_cliente, 
        telefono=telefono if telefono else None  
    )

    try:
        clientes.save()
        return Response({"mensaje": "Cliente registrado con éxito"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        print("Error al guardar en la base de datos:", str(e)) 
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Producto

@api_view(['POST'])
def registrar_producto(request):
    id_producto = request.data.get("id_producto")
    nombre = request.data.get("nombre")
    precio = request.data.get("precio")
    tipo = request.data.get("tipo")
    cantidad = request.data.get("cantidad")

    # Verificar que todos los datos están presentes
    if not all([id_producto, nombre, precio, tipo, cantidad]):
        return Response({"error": "Todos los campos son obligatorios"}, status=status.HTTP_400_BAD_REQUEST)

    # Validar si ya existe un producto con ese ID
    if Producto.objects.filter(id_producto=id_producto).exists():
        return Response({"error": "El producto con este ID ya existe."}, status=status.HTTP_400_BAD_REQUEST)

    # Crear el producto solo si el ID no existe
    producto = Producto(
        id_producto=id_producto,
        nombre=nombre,
        precio=precio,
        tipo=tipo,
        cantidad=cantidad
    )

    try:
        producto.save()
        return Response({"mensaje": "Producto registrado con éxito"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def obtener_productos(request):
    nombre = request.GET.get('nombre', None)
    referencia = request.GET.get('id_producto', None)
    tipos = request.GET.getlist('tipo')  # Permite filtrar por varios tipos

    productos = Producto.objects.all()

    if nombre:
        productos = productos.filter(nombre__icontains=nombre)  # Búsqueda flexible

    if referencia:
        productos = productos.filter(id_producto=referencia)

    if tipos:
        productos = productos.filter(tipo__in=tipos)  # Filtra por lista de tipos

    serializer = ProductoSerializer(productos, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def visualizar_cliente(request):
    cedula = request.GET.get('cedula', None)
    nombre_cliente = request.GET.get('nombre_cliente', None)
    telefono = request.GET.get('telefono', None)

    clientes = Clientes.objects.all()

    if cedula:
        clientes = clientes.filter(cedula__icontains=cedula)  # Filtrar por cédula

    if nombre_cliente:
        clientes = clientes.filter(nombre__icontains=nombre_cliente)  # Filtrar por nombre

    if telefono:
        clientes = clientes.filter(telefono__icontains=telefono)  # Filtrar por teléfono

    serializer = ClienteSerializer(clientes, many=True)
    return Response(serializer.data)
@api_view(['GET'])
def obtener_productoId(request, id):
    try:
        producto = Producto.objects.get(id_producto=id)
        serializer = ProductoSerializer(producto)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Producto.DoesNotExist:
        return Response({"error": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['Put'])
def modificar_producto(request, id):
    try:
        producto = Producto.objects.get(id_producto=id)
    except Producto.DoesNotExist:
        return Response({"error": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    print("Datos recibidos:", request.data)  # 👀 Ver los datos en la terminal

    try:
        serializer = ProductoSerializer(producto, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Datos inválidos", "detalles": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": "Error interno del servidor", "detalles": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


@api_view(['GET'])
def obtener_clientesId(request, id):
    try:
        clientes = Clientes.objects.get(cedula=id)
        serializer = ClienteSerializer(clientes)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Clientes.DoesNotExist:
        return Response({"error": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['Put'])
def modificar_clientes(request, id):
    try:
        cliente = Clientes.objects.get(cedula=id)
    except Clientes.DoesNotExist:
        return Response({"error": "Cliente no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    serializer = ClienteSerializer(cliente, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response({"error": "Datos inválidos", "detalles": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def eliminar_clientes(request, id):
    try:
        cliente = Clientes.objects.get(cedula=id)
        cliente.delete()
        return Response({"message": "Cliente eliminado correctamente"}, status=status.HTTP_204_NO_CONTENT)
    except Clientes.DoesNotExist:
        return Response({"error": "Cliente no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['DELETE'])
def eliminar_producto(request, id):
    try:
        producto = Producto.objects.get(id_producto=id)
        producto.delete()
        return Response({"message": "Producto eliminado correctamente"}, status=status.HTTP_204_NO_CONTENT)
    except Producto.DoesNotExist:
        return Response({"error": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@transaction.atomic
def realizar_venta(request):
    try:
        print("📥 [LOG] Datos recibidos:", request.data)

        data = request.data
        cliente_data = data.get("cliente")
        productos = data.get("productos", [])
        total = data.get("total", 0)

        if not productos:
            return Response({"error": "Debe incluir al menos un producto"}, status=status.HTTP_400_BAD_REQUEST)

        cliente = None
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

                # **Incrementar el contador de compras solo si el cliente ya existía**
                if not created:
                    cliente.compras += 1
                    cliente.save()
                
                print(f"✅ [LOG] Cliente procesado: {cliente.nombre_cliente}, Ventas totales: {cliente.compras}")

        # **Crear la venta**
        venta = Venta.objects.create(cliente=cliente, total=total)
        print(f"🧾 [LOG] Venta creada: {venta.id_venta}")

        for item in productos:
            id_producto = item.get("id_producto")
            cantidad = item.get("cantidad", 0)
            precio = item.get("precio", 0)
            total_item = item.get("total", 0)

            if not id_producto or cantidad <= 0:
                return Response({"error": "Producto inválido o cantidad no válida"}, status=status.HTTP_400_BAD_REQUEST)

            producto = get_object_or_404(Producto, id_producto=id_producto)

            if producto.cantidad < cantidad:
                return Response({"error": f"Stock insuficiente para el producto {producto.nombre}"}, status=status.HTTP_400_BAD_REQUEST)

            # **Actualizar stock del producto**
            producto.cantidad -= cantidad
            producto.save()

            # **Crear detalle de venta**
            DetalleVenta.objects.create(
                venta=venta,
                producto=producto,
                cantidad=cantidad,
                precio=precio,
                total=total_item
            )

        print("🎉 [LOG] Venta registrada exitosamente")
        return Response({"mensaje": "Venta registrada exitosamente"}, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"🔥 [ERROR] Excepción no controlada: {e}")
        return Response({"error": f"Error al registrar la venta: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def obtener_clientes(request):
    clientes = Clientes.objects.all()
    serializer = ClienteSerializer(clientes, many=True)
    return Response(serializer.data)


@api_view(['GET'])  # ✅ NECESARIO
def obtener_ventas(request):
    try:
        fecha_param = request.GET.get('fecha')

        if fecha_param:
            try:
                fecha_obj = datetime.strptime(fecha_param, "%Y-%m-%d").date()
                ventas = Venta.objects.filter(fecha__date=fecha_obj)
            except ValueError:
                return Response({'message': 'Formato de fecha inválido. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            ventas = Venta.objects.all()

        serializer = VentaSerializer(ventas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET'])
def obtener_informe(request, tipo):
    print(f"Tipo recibido: {tipo}")
    try:
        fecha_param = request.query_params.get('fecha')
        ahora = timezone.now()

        # Si hay una fecha, parsearla
        if fecha_param:
            try:
                if tipo == 'informe-diario':
                    # Parsear la fecha diaria
                    fecha = datetime.strptime(fecha_param, "%Y-%m-%d").date()
                    inicio = timezone.make_aware(datetime.combine(fecha, datetime.min.time()))
                    fin = timezone.make_aware(datetime.combine(fecha, datetime.max.time()))
                elif tipo == 'informe-mensual':
                    # Parsear la fecha mensual
                    fecha = datetime.strptime(fecha_param, "%Y-%m").date()
                    inicio = timezone.make_aware(datetime(fecha.year, fecha.month, 1))
                    # Calcular fin del mes
                    if fecha.month == 12:
                        fin = timezone.make_aware(datetime(fecha.year + 1, 1, 1)) - timezone.timedelta(seconds=1)
                    else:
                        fin = timezone.make_aware(datetime(fecha.year, fecha.month + 1, 1)) - timezone.timedelta(seconds=1)
                else:
                    return Response({'message': 'Tipo de informe inválido. Use "informe-diario" o "informe-mensual".'}, status=400)
            except ValueError:
                return Response({'message': 'Formato de fecha inválido.'}, status=400)
        else:
            # Sin fecha → usar actual
            if tipo == 'informe-diario':
                inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
                fin = ahora
            elif tipo == 'informe-mensual':
                inicio = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                fin = ahora
            else:
                return Response({'message': 'Tipo de informe inválido. Use "informe-diario" o "informe-mensual".'}, status=400)

        # Consultar las ventas en el rango de fechas
        ventas = Venta.objects.filter(fecha__range=(inicio, fin))
        detalles = DetalleVenta.objects.filter(venta__in=ventas)

        # Calcular los datos agregados
        numero_ventas = ventas.count()
        total_vendido = ventas.aggregate(total=Sum('total'))['total'] or 0

        # Obtener los top productos por cantidad y valor
        top_productos_cantidad = detalles.values('producto__nombre') \
            .annotate(total_cantidad=Sum('cantidad')) \
            .order_by('-total_cantidad')[:5]

        top_productos_valor = detalles.values('producto__nombre') \
            .annotate(valor_total=Sum('total')) \
            .order_by('-valor_total')[:5]

        # Devolver la respuesta con los resultados
        return Response({
            'tipo_informe': tipo,
            'fecha_inicio': inicio.strftime("%Y-%m-%d %H:%M"),
            'fecha_fin': fin.strftime("%Y-%m-%d %H:%M"),
            'numero_ventas': numero_ventas,
            'total_vendido': float(total_vendido),
            'top_5_productos_por_cantidad': list(top_productos_cantidad),
            'top_5_productos_por_valor': list(top_productos_valor),
        }, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)