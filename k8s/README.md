# Deploying a Node App to Kubernetes
## Prerequisites
- A Kubernetes cluster (you can use Minikube for local development or a cloud provider’s Kubernetes service).
- Docker installed on your local machine for building container images.
- A node application that you want to deploy.

## Step 1: Containerize Your Node App
```
FROM node:18-alpine

WORKDIR /app

COPY ./package.json .

RUN npm install

EXPOSE 3000

COPY . .

CMD ["npm","start"]
```
---
- Step is to containerize your React application by creating a multi-stage Dockerfile.
- This approach ensures the final image is small, efficient, and production-ready.
```bash
# Step 1 — Build the React app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Step 2 — Serve the app using Nginx
FROM nginx:1.25-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
---
### Build the Docker Image
 ```bash
 docker build -t node-app .  
```

## Step 2: Push Docker Image to a Container Registry
- Once the image is built, push it to a container registry such as Docker Hub, Google Container Registry, or Amazon ECR.
```
docker tag node-app vaishnavimpatil/node-app:latest
```
```
 docker push vaishnavimpatil/node-app:latest
```

Step 3: Create Kubernetes Deployment
Create a file named `deployment.yaml`:
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-app-deploy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: node-app
  template:
    metadata:
      labels:
        app: node-app
    spec:
      containers:
        - name: node-app
          image: vaishnavimpatil/node-app
          ports:
            - containerPort: 3000
```

### Apply the Deployment manifest:
```
kubectl apply -f deployment.yaml
```

## Step 4: Expose Your Deployment with a Service
- To make your React app accessible from outside the cluster, create a Service.
- Here’s a `service.yaml`:
```
apiVersion: v1
kind: Service
metadata:
  name: node-app-service
spec:
  selector:
    app: node-app
  type: NodePort
  ports:
    - port: 3000
      targetPort: 3000
      nodePort: 30000
```
![service port](https://github.com/Vaishnavi-M-Patil/workshop-app-nodeJS/blob/main/k8s/k8sports.png)

#### Port
- port is the port number on the Service itself, inside the cluster.​
- Other pods use this value when they talk to the Service, for example http://my-service:80, and the Service then forwards that traffic to the targetPort on matching pods.​

#### TargetPort
- targetPort is the `port on the Pod’s container` where your application is actually listening (for example, your Node.js app on 3000 or 8080).​
- The Service takes traffic that arrived on port and sends it to targetPort on one of the selected pods; if you don’t specify targetPort, it defaults to the same value as port.​

#### NodePort
- nodePort is only used for Service type NodePort (and also behind LoadBalancer); it is the port opened on every worker node’s IP to allow external access from outside the cluster.​
- External clients call nodeIP:nodePort, that traffic goes into the Service’s port, and then finally to targetPort on the pods.
- By default nodePort must be in the `30000–32767` range, or Kubernetes auto-assigns one in that range.

### Apply the Service manifest to your Kubernetes cluster:
```
kubectl apply -f service.yaml
```

## Step 5: Access Your node App
- Finally, access your React app through the exposed NodePort.
