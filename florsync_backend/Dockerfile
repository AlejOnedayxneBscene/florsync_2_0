FROM python:3.13-slim

RUN apt-get update && apt-get install -y \
    postgresql-client \
    ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

CMD ["sh", "-c", "python manage.py migrate && gunicorn --bind 0.0.0.0:10000 NOMBRE_PROYECTO.wsgi:application"]