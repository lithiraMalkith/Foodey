@echo off
echo Starting Foodey Application Setup...
echo.
echo This script will:
echo 1. Start Minikube
echo 2. Build Docker images
echo 3. Apply Kubernetes configurations
echo 4. Set up port forwarding
echo.
echo Press any key to continue...
pause > nul

:: Start Minikube if not already running
echo Checking if Minikube is running...
minikube status > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting Minikube...
    start "Starting Minikube" cmd /c "minikube start && echo Minikube started successfully. && pause"
    echo Waiting for Minikube to start...
    timeout /t 30 /nobreak > nul
) else (
    echo Minikube is already running.
)

:: Set Docker environment to use Minikube's Docker daemon
echo Setting Docker environment to use Minikube's Docker daemon...
echo This may take a moment...
for /f "tokens=*" %%i in ('minikube -p minikube docker-env --shell cmd') do %%i

:: Build Docker images for all services
echo Building Docker images for all services...
cd /d "%~dp0"

echo Building user-service image...
docker build -t user-service:1.0 ./user-service

echo Building order-service image...
docker build -t order-service:1.0 ./order-service

echo Building restaurant-service image...
docker build -t restaurant-service:1.0 ./restaurant-service

echo Building delivery-service image...
docker build -t delivery-service:1.0 ./delivery-service

echo Building notification-service image...
docker build -t notification-service:1.0 ./notification-service

echo Building admin-service image...
docker build -t admin-service:1.0 ./admin-service

echo Building payment-service image...
docker build -t payment-service:1.0 ./payment-service

echo Building frontend image...
docker build -t frontend:1.0 ./frontend

:: Apply Kubernetes configurations
echo Applying Kubernetes configurations...
cd /d "%~dp0k8s-updated"

echo Creating secrets...
kubectl apply -f secrets.yaml

echo Deploying MongoDB...
kubectl apply -f mongodb-deployment.yaml
echo Waiting for MongoDB to be ready...
timeout /t 10 /nobreak > nul

echo Deploying backend services...
kubectl apply -f user-deployment.yaml
kubectl apply -f order-deployment.yaml
kubectl apply -f restaurant-deployment.yaml
kubectl apply -f delivery-deployment.yaml
kubectl apply -f notification-deployment.yaml
kubectl apply -f admin-deployment.yaml
kubectl apply -f payment-deployment.yaml

echo Waiting for backend services to be ready...
timeout /t 20 /nobreak > nul

echo Deploying frontend...
kubectl apply -f frontend-deployment.yaml

echo Waiting for all services to be ready...
timeout /t 10 /nobreak > nul

:: Start port forwarding for each service in a separate window
echo Starting port forwarding for all services...

start "User Service (3001)" cmd /c "kubectl port-forward service/user-service 3001:3001 && pause"
timeout /t 2 /nobreak > nul

start "Order Service (3002)" cmd /c "kubectl port-forward service/order-service 3002:3002 && pause"
timeout /t 2 /nobreak > nul

start "Restaurant Service (3003)" cmd /c "kubectl port-forward service/restaurant-service 3003:3003 && pause"
timeout /t 2 /nobreak > nul

start "Delivery Service (3004)" cmd /c "kubectl port-forward service/delivery-service 3004:3004 && pause"
timeout /t 2 /nobreak > nul

start "Notification Service (3005)" cmd /c "kubectl port-forward service/notification-service 3005:3005 && pause"
timeout /t 2 /nobreak > nul

start "Admin Service (3006)" cmd /c "kubectl port-forward service/admin-service 3006:3006 && pause"
timeout /t 2 /nobreak > nul

start "Payment Service (3007)" cmd /c "kubectl port-forward service/payment-service 3007:3007 && pause"
timeout /t 2 /nobreak > nul

start "Frontend (3000)" cmd /c "kubectl port-forward service/frontend 3000:80 && pause"
timeout /t 2 /nobreak > nul

echo.
echo All setup steps completed!
echo Your Foodey application should now be accessible at: http://localhost:3000
echo.
echo IMPORTANT: Keep all terminal windows open while using the application.
echo When you're done, you can close all terminal windows to stop port forwarding.
echo.
echo Press any key to open the application in your default browser...
pause > nul

start http://localhost:3000
