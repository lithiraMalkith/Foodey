# Deploying Foodey on Minikube

This guide will help you deploy the Foodey application on Minikube for local Kubernetes development.

## Prerequisites

- [Minikube](https://minikube.sigs.k8s.io/docs/start/) installed
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) installed
- [Docker](https://docs.docker.com/get-docker/) installed
- PowerShell (for Windows)

## Deployment Steps

### 1. Start Minikube

```powershell
minikube start
```

### 2. Enable Ingress Controller

```powershell
minikube addons enable ingress
```

### 3. Set Docker Environment to Use Minikube's Docker Daemon

This step is crucial to ensure that the images you build are available to Minikube.

```powershell
minikube docker-env | Invoke-Expression
```

### 4. Build Docker Images for All Services

```powershell
docker build -t user-service:1.0 ./user-service
docker build -t order-service:1.0 ./order-service
docker build -t restaurant-service:1.0 ./restaurant-service
docker build -t delivery-service:1.0 ./delivery-service
docker build -t notification-service:1.0 ./notification-service
docker build -t admin-service:1.0 ./admin-service
docker build -t payment-service:1.0 ./payment-service
docker build -t frontend:1.0 ./frontend
```

### 5. Apply Kubernetes Configurations

Apply the configurations in the following order:

```powershell
# Apply secrets first
kubectl apply -f ./k8s-updated/secrets.yaml

# Apply MongoDB deployment
kubectl apply -f ./k8s-updated/mongodb-deployment.yaml

# Wait for MongoDB to be ready
Start-Sleep -Seconds 10

# Apply backend services
kubectl apply -f ./k8s-updated/user-deployment.yaml
kubectl apply -f ./k8s-updated/order-deployment.yaml
kubectl apply -f ./k8s-updated/restaurant-deployment.yaml
kubectl apply -f ./k8s-updated/delivery-deployment.yaml
kubectl apply -f ./k8s-updated/notification-deployment.yaml
kubectl apply -f ./k8s-updated/admin-deployment.yaml
kubectl apply -f ./k8s-updated/payment-deployment.yaml

# Wait for backend services to be ready
Start-Sleep -Seconds 20

# Apply frontend deployment
kubectl apply -f ./k8s-updated/frontend-deployment.yaml

# Apply ingress configuration
kubectl apply -f ./k8s-updated/ingress.yaml
```

### 6. Configure Local Hosts File

Add an entry to your hosts file to map `foodey.local` to the Minikube IP:

```
<minikube-ip> foodey.local
```

To get the Minikube IP, run:

```powershell
minikube ip
```

On Windows, the hosts file is located at: `C:\Windows\System32\drivers\etc\hosts`

### 7. Access Your Application

You can now access your application at: `http://foodey.local`

Alternatively, you can access the frontend service directly using:

```powershell
minikube service frontend --url
```

## Using the Automated Deployment Script

For convenience, an automated deployment script is provided. Run it from the root of your project:

```powershell
.\k8s-updated\deploy-to-minikube.ps1
```

## Monitoring and Troubleshooting

### Check Pod Status

```powershell
kubectl get pods
```

### View Pod Logs

```powershell
kubectl logs <pod-name>
```

### Access a Pod's Shell

```powershell
kubectl exec -it <pod-name> -- /bin/bash
```

### View Service Details

```powershell
kubectl get services
```

### View Ingress Details

```powershell
kubectl get ingress
```

## Cleaning Up

To delete all resources and start fresh:

```powershell
kubectl delete -f ./k8s-updated/
```

To stop Minikube:

```powershell
minikube stop
```

## Important Notes

1. The Kubernetes configurations use secrets for sensitive information. In a production environment, you would manage these secrets more securely.

2. The frontend environment variables are configured to use the Kubernetes service names. This works within the cluster but may need adjustment for external access.

3. For persistent data, the MongoDB deployment uses a PersistentVolumeClaim. In Minikube, this is automatically provisioned, but in a production environment, you would need to configure appropriate storage.

4. The ingress configuration assumes you're using the NGINX ingress controller that comes with Minikube. In other environments, you might need to adjust this configuration.
