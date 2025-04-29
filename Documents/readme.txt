readme.txt

# Deployment Guide

## Prerequisites
- Docker installed
- Kubernetes (Minikube or any cloud K8s)
- Node.js and npm
- MongoDB / PostgreSQL instance
- Git

## Backend Services (Microservices)
1. Clone the repository:
   git clone https://github.com/your-group-name/food-delivery-microservices.git

2. Navigate to each service folder (e.g., /restaurant-service, /order-service) and run:
   docker build -t <service-name> .
   docker tag <service-name> your-dockerhub/<service-name>
   docker push your-dockerhub/<service-name>

3. Apply Kubernetes manifests:
   kubectl apply -f k8s/

4. Ensure all services are up:
   kubectl get pods

## Frontend (React/Angular)
1. Navigate to the frontend directory:
   cd frontend

2. Install dependencies:
   npm install

3. Start the app:
   npm start

4. Access the app at: http://localhost:3000

## Additional Notes
- Payments via PayHere (sandbox)
- Email: SendGrid API
- SMS: Twilio API

