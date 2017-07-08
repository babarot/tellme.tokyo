FROM nginx:alpine
COPY public /usr/share/nginx/html
COPY default.nginx /etc/nginx/conf.d/default.conf
