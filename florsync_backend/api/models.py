from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from productos.models import Producto

class Clientes(models.Model):
    cedula = models.CharField(max_length=20, primary_key=True)
    direccion = models.TextField(blank=True, null=True)
    correo = models.EmailField(max_length=100, blank=True, null=True)
    nombre_cliente = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    compras = models.IntegerField(default=0)  
    fecha_registro = models.DateField(auto_now_add=True)  
    activo = models.BooleanField(default=True)
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
    
from django.db import models

class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=50, unique=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre_categoria


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
