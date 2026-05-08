# fix SSL Keycloak

[https://www.youtube.com/watch?v=7Ict7nML-Yo&ab_channel=hexaDefence]
[https://youtu.be/g6QusDptDuA?si=XERa1TJ9Bq5BUupr]
[https://youtu.be/6ye4lP9EA2Y?si=27h5am7FkRjSHOwL]

```yaml

version: '3.7'
volumes:
  postgres_data:
    driver: local
services:
  postgres:
    image: postgres:latest
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: 123456
    ports:
      - "5432:5432"
    networks:
      - keycloak_demo
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    container_name: keycloak_dev
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: temp
      KC_BOOTSTRAP_ADMIN_PASSWORD: temp
      KC_HTTP_ENABLED: "true"
      KC_HOSTNAME_STRICT: "false"
      KC_HOSTNAME_STRICT_HTTPS: "false"
      KC_PROXY: "none"
      KC_HOSTNAME: "dev.blueledgers.com"
      KC_HTTP_PORT: 8080
      KC_HTTPS_PORT: 8443
      KC_DB: postgres
      KC_DB_URL_HOST: postgres
      KC_DB_URL_DATABASE: keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: 123456
    ports:
      - "8080:8080"
    command: start-dev
    depends_on:
      - postgres
    networks:
      - keycloak_demo
networks:
  keycloak_demo:
    driver: bridge

```

``` bash

cd /opt/keycloak/bin
./kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin
./kcadm.sh update realms/master -s sslRequired=NONE

```

