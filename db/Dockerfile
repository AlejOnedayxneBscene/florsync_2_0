FROM postgres:15

RUN apt-get update && apt-get install -y curl

COPY archive.sh /scripts/archive.sh
RUN chmod +x /scripts/archive.sh