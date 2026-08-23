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

CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && python manage.py create_admin && gunicorn --bind 0.0.0.0:${PORT:-10000} florsync.wsgi:application"]