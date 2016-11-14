FROM debian:stable

MAINTAINER <eloy@sandboxwebs.com>

ENV SCIROCCO_ENV
ENV SCIROCCO_PORT
ENV SCIROCCO_MONGO_URL
ENV SCIROCCO_MASTER_TOKEN
ENV SCIROCCO_MAX_KB_SIZE_RAW
ENV SCIROCCO_MAX_KB_SIZE_TEXT
ENV SCIROCCO_MAX_KB_SIZE_JSON
ENV SCIROCCO_MAX_GET_ALL_MESSAGES

COPY docker-entrypoint.sh /

RUN apt-get update && apt-get upgrade -y && apt-get dist-upgrade -y \
&& apt-get install -y curl wget git \
&& curl -sL https://deb.nodesource.com/setup_6.x | bash - \
&& apt-get install -y nodejs \
&& useradd -r -d /usr/src/app app && mkdir -p /usr/src/app && chown app.app /usr/src/app \
&& chmod 755 /docker-entrypoint.sh

USER app

RUN git clone https://github.com/eloylp/scirocco-server.git /usr/src/app

ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 8000

