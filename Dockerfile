FROM node:24.0.1 AS compile-image

RUN curl -L https://github.com/a8m/envsubst/releases/download/v1.2.0/envsubst-`uname -s`-`uname -m` -o envsubst
RUN chmod +x envsubst
RUN mv envsubst /usr/local/bin

ENV PATH="./node_modules/.bin:$PATH"

COPY . /app
WORKDIR /app
RUN npm install

RUN ng build --configuration=production

FROM nginx:1.28.0
ENV HTML_DIR=/usr/share/nginx/html

COPY --from=compile-image /app/dist/sucolo-routing-frontend/browser $HTML_DIR
COPY docker/entrypoint.sh /tmp/
COPY docker/config.template.json /tmp/
COPY docker/default.conf /etc/nginx/conf.d/

RUN chmod +x /tmp/entrypoint.sh

ENTRYPOINT ["/tmp/entrypoint.sh"]
