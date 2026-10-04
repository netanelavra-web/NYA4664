FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY nya-cloud-logo.png /usr/share/nginx/html/nya-cloud-logo.png
EXPOSE 8080
RUN sed -i 's/listen       80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
