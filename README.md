# run

```
docker compose up -d
docker compose down
```

# run local services

```local kafka redis
cd scripts
docker compose up -d
docker compose down
```

```local
cd services-consumer
yarn dev
```

```local
cd services-producer
yarn dev
```
