#!/bin/bash
set -e

# Configuration
DOCKER_REGISTRY="dinhdobathi"
IMAGE_NAME="mcpjungle-cli"
TAG=${1:-latest}
NO_PUSH=${NO_PUSH:-false}

# Print information
if [ "$NO_PUSH" != "true" ]; then
  echo "Building and pushing MCPJungle CLI Docker image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}"
else
  echo "Building MCPJungle CLI Docker image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG} (NO_PUSH=true)"
fi

# Check if Docker buildx is available
if docker buildx version > /dev/null 2>&1; then
  echo "Docker buildx is available - building multi-architecture image"
  
  # Create builder if it doesn't exist
  if ! docker buildx ls | grep -q multiarch; then
    echo "Creating new builder instance..."
    docker buildx create --use --name multiarch
  fi
  
  # Build multi-architecture image
  if [ "$NO_PUSH" != "true" ]; then
    docker buildx build \
      --platform linux/amd64,linux/arm64 \
      --tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG} \
      --file Dockerfile.cli \
      --push \
      .
    echo "Successfully built and pushed multi-arch image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}"
  else
    docker buildx build \
      --platform linux/amd64,linux/arm64 \
      --tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG} \
      --file Dockerfile.cli \
      .
    echo "Successfully built multi-arch image (not pushed): ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}"
  fi
else
  echo "Docker buildx not available - building single architecture image"
  
  # Build the image for current architecture
  echo "Building MCPJungle CLI image..."
  docker build -f Dockerfile.cli -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG} .
  
  # Test the image
  echo "Testing the built image..."
  docker run --rm ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG} mcpjungle version
  
  if [ "$NO_PUSH" != "true" ]; then
    # Push the image
    echo "Pushing MCPJungle CLI image..."
    docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}
    echo "Successfully built and pushed: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}"
  else
    echo "Successfully built (not pushed): ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}"
  fi
fi

echo ""
echo "Usage examples:"
echo "  docker run --rm ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG} mcpjungle --help"
echo "  docker run --rm ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG} mcpjungle list servers --registry http://your-server:8080"