from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class Clientes(models.Model):
    cedula = models.CharField(max_length=20, primary_key=True)
    direccion = models.TextField(blank=True, null=True)
    correo = models.EmailField(max_length=100, blank=True, null=True)
    nombre_cliente = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    compras = models.IntegerField(default=0)  
    fecha_registro = models.DateField(auto_now_add=True)  

    def __str__(self):
        return self.nombre_cliente


class Usuarios(models.Model):
    id_usuario = models.IntegerField(primary_key=True)
    contrasena = models.CharField(max_length=255)

    def save(self, *args, **kwargs):
        # Encripta la contraseña antes de guardar
        self.contrasena = make_password(self.contrasena)
        super().save(*args, **kwargs)

    def verificar_contraseña(self, password):
        return check_password(password, self.contrasena)  # Verifica la contraseña encriptada
    
class Venta(models.Model):
    id_venta = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(Clientes, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        cliente_info = self.cliente.nombre_cliente if self.cliente else "Anónimo"
        return f"Venta #{self.id_venta} - {cliente_info} - {self.fecha.strftime('%d/%m/%Y')}"

class Producto(models.Model):
    id_producto = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=50)
    cantidad = models.IntegerField()

    def __str__(self):
        return self.nombre

class DetalleVenta(models.Model):
    id_detalle = models.AutoField(primary_key=True)
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Detalle {self.id_detalle} - Venta {self.venta.id_venta} - {self.producto.nombre}"

class Reporte(models.Model):
    id_reporte = models.AutoField(primary_key=True)
    tipo_reporte = models.CharField(max_length=50)  # 'diario' o 'mensual'
    fecha = models.DateTimeField(auto_now_add=True)
    total_vendido = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Reporte {self.tipo_reporte} - {self.fecha.strftime('%d/%m/%Y')}"


class ReporteProductosVendidos(models.Model):
    reporte = models.ForeignKey(Reporte, on_delete=models.CASCADE)
    producto_mas_vendido = models.CharField(max_length=100)
    cantidad = models.IntegerField()

    def __str__(self):
        return f"Reporte {self.reporte.id_reporte} - Producto {self.producto_mas_vendido}"
