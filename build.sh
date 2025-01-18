docker image build -f Dockerfile -t forum:latest .
docker container run -p 8080:8080 forum:latest