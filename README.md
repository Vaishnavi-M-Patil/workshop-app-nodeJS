# workshop-app-nodeJS

### To build `Dockerfile`:
```
 docker build -t node-app .
```
### to run docker container:
```
docker run -d -p 3000:3000 --name node-app-container node-app:latest
```
### Run docker compose file:
```
docker compose up -d
```
