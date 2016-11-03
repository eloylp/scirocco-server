FROM debian:stable

MAINTAINER <eloy@sandboxwebs.com>

COPY docker-entrypoint.sh /

RUN echo "Europe/Madrid" > /etc/timezone \
&& dpkg-reconfigure -f noninteractive tzdata \
&& apt-get update && apt-get upgrade -y && apt-get dist-upgrade -y \
&& apt-get install -y curl wget git \
&& curl -sL https://deb.nodesource.com/setup_6.x | bash - \
&& apt-get install -y nodejs \
&& useradd -r -d /usr/src/app app && mkdir -p /usr/src/app && chown app.app /usr/src/app \
&& chmod 755 /docker-entrypoint.sh

USER app

RUN git clone https://github.com/eloylp/scirocco-server.git /usr/src/app

ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 8000

