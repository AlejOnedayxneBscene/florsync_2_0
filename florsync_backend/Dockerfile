# Usa la imagen oficial de Python
FROM python:3.13

# Instalar Node.js, npm, y Rust (cargo)
RUN apt-get update && \
    apt-get install -y nodejs npm rustc cargo

# Crear directorio de la app
RUN mkdir /app

# Usar una imagen base de Python
FROM python:3.13

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar las dependencias de Python
COPY requirements.txt /app/

# Instalar las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el backend
COPY . /app/

# Ejecutar las migraciones y el servidor Django
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]


