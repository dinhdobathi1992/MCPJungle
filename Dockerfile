# Build stage
FROM golang:1.24.3-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o mcpjungle .

# Final stage
FROM gcr.io/distroless/base

# Copy the binary from the build stage
COPY --from=builder /app/mcpjungle /mcpjungle

EXPOSE 8080
ENTRYPOINT ["/mcpjungle"]

# Run the Registry Server by default
CMD ["start"]