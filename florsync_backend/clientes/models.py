from django.db import models

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