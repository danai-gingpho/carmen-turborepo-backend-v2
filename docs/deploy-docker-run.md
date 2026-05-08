# run docker

```bash

docker build -t backend-gateway -f apps/backend-gateway/Dockerfile .
docker build -t micro-business -f apps/micro-business/Dockerfile .
docker build -t micro-cluster -f apps/micro-cluster/Dockerfile .
docker build -t micro-file -f apps/micro-file/Dockerfile .
docker build -t micro-keycloak-api -f apps/micro-keycloak-api/Dockerfile .
docker build -t micro-notification -f apps/micro-notification/Dockerfile .

OR

docker build -t backend-gateway -f apps/backend-gateway/Dockerfile . --no-cache --build-arg TURBO_TEAM="XXXX" --build-arg TURBO_TOKEN="XXXX"

docker run -d -p 4000:4000 -p 4001:4001 --name backend-gateway backend-gateway
docker run -d -p 5020:5020 -p 6020:6020 --name micro-business micro-business
docker run -d -p 5014:5014 -p 6014:6014 --name micro-cluster micro-cluster
docker run -d -p 5007:5007 -p 6007:6007 --name micro-file micro-file
docker run -d -p 5013:5013 -p 6013:6013 --name micro-keycloak-api micro-keycloak-api
docker run -d -p 5006:5006 -p 6006:6006 --name micro-notification micro-notification

docker run --rm -it --entrypoint sh backend-gateway
docker run --rm -it --entrypoint sh micro-business
docker run --rm -it --entrypoint sh micro-cluster
docker run --rm -it --entrypoint sh micro-file
docker run --rm -it --entrypoint sh micro-keycloak-api
docker run --rm -it --entrypoint sh micro-notification


# remove

docker rm -f backend-gateway
docker rm -f micro-business
docker rm -f micro-cluster
docker rm -f micro-file
docker rm -f micro-keycloak-api
docker rm -f micro-notification


```
