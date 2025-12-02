# Deploying a Node App On Kubernetes Cluster
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

## Step 3: Create Kubernetes Deployment
1. Create a file named `namespace.yaml`:
```
apiVersion: v1
kind: Namespace
metadata: 
  name: node
```
1. Create a file named `config.yaml`:
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-config
  namespace: node
data:
  host: mysql-service
  user: root
  db_name: music_database
```
1. Create a file named `secret.yaml`:
```
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
  namespace: node
type: Opaque
data:
  password: cm9vdA==
```
1. Create a file named `pvcclaim.yaml`:
```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
  namespace: node
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```
1. Create a file named `mysql-deployment.yaml`:
```

apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql-deployment
  namespace: node
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      name: mysql-pod
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: password
        - name: MYSQL_DATABASE
          valueFrom:
            configMapKeyRef:
              name: mysql-config
              key: db_name
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-storage
        persistentVolumeClaim:
          claimName: mysql-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: mysql-service
  namespace: node
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306

```

1. Create a file named `deployment.yaml`:
```
apiVersion: apps/v1
kind: Deployment
metadata: 
  name: node-deployment
  namespace: node
spec:
  replicas: 1
  selector:
    matchLabels:
      app: node-app
  template:
    metadata: 
      name: node-app-pod
      namespace: node
      labels:
        app: node-app
    spec:
      containers:
      - name: node-app
        image: vaishnavimpatil/node-app
        ports: 
        - containerPort: 3000
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: mysql-config
              key: host           
        - name: DB_USER
          valueFrom:
            configMapKeyRef:
              name: mysql-config
              key: user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: password
        - name: DB_NAME
          valueFrom:
            configMapKeyRef:
              name: mysql-config
              key: db_name
---

apiVersion: v1
kind: Service
metadata:
  name: node-app-service
  namespace: node
spec:
  type: NodePort 
  selector:
    app: node-app
  ports:
  - port: 3000
    targetPort: 3000
    nodePort: 30000
```

### Apply the Deployment manifest:
```
kubectl apply -f namespace.yaml
```
```
kubectl apply -f config.yaml
```
```
kubectl apply -f secret.yaml
```
```
kubectl apply -f pvcclaim.yaml
```
```
kubectl apply -f mysql-deployment.yaml
```
```
kubectl apply -f deployment.yaml
```

## Step 4: Expose Your Deployment with a Service
- To make your Node app accessible from outside the cluster, create a External Service.
- Also create Internal service for database.
`Internal Service`:
```
apiVersion: v1
kind: Service
metadata:
  name: mysql-service
  namespace: node
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
```
`External Service`:
```
apiVersion: v1
kind: Service
metadata:
  name: node-app-service
  namespace: node
spec:
  type: NodePort 
  selector:
    app: node-app
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

### Note:
In this project you need to make change in your app.js file for that follow given steps.
- Take access of pod.
```
kubectl exec -it node-deployment-7fdc4d77d9-cmgz5 -n node -- sh
```
- check MySQL service is accessible or not. It gives `open` as a output. 
```
nc -zv mysql-service 3306
```
- Inside `app.js` file change host IP with mysql service name.
```
vi app.js
```
```
host: process.env.DB_HOST || 'mysql-service',
```
```
kubectl get deployment -n node
```
- Restart the deployment
```
kubectl rollout restart deployment node-deployment -n node
```
- After restarting the deployment check logs of node pod to check application is running successfully.
```
kubectl logs node-deployment-68d849575b-l9n7p -n node
```

### Enter inside the mysql pod:
```
kubectl exec -it mysql-deployment-657d9c5488-2f9pk -n node -- bash
```
### Database commands to create table and add data into it:
```
mysql -uroot -p
```
```
 USE music_database; 
```
```
CREATE TABLE songs ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, artist VARCHAR(255) NOT NULL, url VARCHAR(255) NOT NULL, date_created DATETIME DEFAULT CURRENT_TIMESTAMP ); 
```
```
INSERT INTO songs (name, artist, url) VALUES('Sample Song', 'Unknown Artist', 'sample-song.mp3'),('Sample Song 1', 'Unknown Artist', 'sample-song1.mp3'),('Sample Song 2', 'Unknown Artist', 'sample-song2.mp3'),('Sample Song 3', 'Unknown Artist', 'sample-song3.mp3'),('Sample Song 4', 'Unknown Artist', 'sample-song4.mp3'),('Sample Song 5', 'Unknown Artist', 'sample-song5.mp3'),('Sample Song 6', 'Unknown Artist', 'sample-song6.mp3'),('Sample Song 7', 'Unknown Artist', 'sample-song7.mp3'),('Sample Song 8', 'Unknown Artist', 'sample-song8.mp3');
```

## Step 5: Access Your node App
- Finally, access your React app through the exposed NodePort.
