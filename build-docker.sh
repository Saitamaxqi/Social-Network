#!/bin/bash
set -e

echo "Building and starting Social Network with Docker Compose..."

# Build and start the containers
docker-compose up --build -d

echo "Containers are running!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8080"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
