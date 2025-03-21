#!/bin/bash

# Build the backend image
echo "Building backend image..."
docker image build -f DockerBackend -t social-backend:latest .

# Build the frontend image
echo "Building frontend image..."
docker image build -f DockerFrontend -t social-frontend:latest .

# Run the backend container in detached mode
echo "Starting backend container..."
docker container run -d -p 8080:8080 --name social-backend social-backend:latest

# Run the frontend container in detached mode
echo "Starting frontend container..."
docker container run -d -p 3000:3000 --name social-frontend social-frontend:latest

echo "Both containers are now running!"
echo "Backend available at: http://localhost:8080"
echo "Frontend available at: http://localhost:3000"