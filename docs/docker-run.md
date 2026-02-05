# run docker

```bash

docker build -t micro-authen -f apps/micro-authen/Dockerfile .
docker build -t micro-cluster -f apps/micro-cluster/Dockerfile .
docker build -t micro-file -f apps/micro-file/Dockerfile .
docker build -t micro-license -f apps/micro-license/Dockerfile .
docker build -t micro-notification -f apps/micro-notification/Dockerfile .
docker build -t micro-tenant-master -f apps/micro-tenant-master/Dockerfile .
docker build -t micro-tenant-procurement -f apps/micro-tenant-procurement/Dockerfile .
docker build -t micro-tenant-inventory -f apps/micro-tenant-inventory/Dockerfile .
docker build -t micro-tenant-recipe -f apps/micro-tenant-recipe/Dockerfile .
docker build -t backend-gateway -f apps/backend-gateway/Dockerfile .

OR

docker build -t micro-authen -f apps/micro-authen/Dockerfile . --no-cache --build-arg TURBO_TEAM="XXXX" --build-arg TURBO_TOKEN="XXXX"

docker run -d -p 5001:5001 -p 6001:6001 --name micro-authen micro-authen
docker run -d -p 5002:5002 -p 6002:6002 --name micro-cluster micro-cluster
docker run -d -p 5007:5007 -p 6007:6007 --name micro-file micro-file
docker run -d -p 5003:5003 -p 6003:6003 --name micro-license micro-license
docker run -d -p 5006:5006 -p 6006:6006 --name micro-notification micro-notification
docker run -d -p 5011:5011 -p 6011:6011 --name micro-tenant-master micro-tenant-master
docker run -d -p 5009:5009 -p 6009:6009 --name micro-tenant-procurement micro-tenant-procurement
docker run -d -p 5008:5008 -p 6008:60080 --name micro-tenant-inventory micro-tenant-inventory
docker run -d -p 5010:5010 -p 6010:6010 --name micro-tenant-recipe micro-tenant-recipe
docker run -d -p 4000:4000 --name backend-gateway backend-gateway

docker run --rm -it --entrypoint sh micro-authen
docker run --rm -it --entrypoint sh micro-cluster
docker run --rm -it --entrypoint sh micro-file
docker run --rm -it --entrypoint sh micro-license
docker run --rm -it --entrypoint sh micro-notification
docker run --rm -it --entrypoint sh micro-tenant-master
docker run --rm -it --entrypoint sh micro-tenant-procurement
docker run --rm -it --entrypoint sh micro-tenant-inventory
docker run --rm -it --entrypoint sh micro-tenant-recipe
docker run --rm -it --entrypoint sh backend-gateway


# remove

docker rm -f micro-authen
docker rm -f micro-cluster
docker rm -f micro-file
docker rm -f micro-license
docker rm -f micro-notification
docker rm -f micro-tenant-master
docker rm -f micro-tenant-procurement
docker rm -f micro-tenant-inventory
docker rm -f micro-tenant-recipe
docker rm -f backend-gateway


```
