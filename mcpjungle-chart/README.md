# MCPJungle Helm Chart

This Helm chart deploys MCPJungle, a self-hosted MCP Gateway for private AI agents.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- Ingress controller (like NGINX Ingress Controller)

## Installing the Chart

To install the chart with the release name `mcpjungle`:

```bash
helm install mcpjungle ./mcpjungle-chart
```

## Configuration

The following table lists the configurable parameters of the MCPJungle chart and their default values.

| Parameter | Description | Default |
| --------- | ----------- | ------- |
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Image repository | `dinhdobathi/mcpjungle` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `8080` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `nginx` |
| `ingress.hosts` | Ingress hosts | `[{host: mcpjungle.local, paths: [{path: /, pathType: Prefix}]}]` |
| `postgresql.enabled` | Enable PostgreSQL | `true` |
| `postgresql.auth.username` | PostgreSQL username | `mcpjungle` |
| `postgresql.auth.password` | PostgreSQL password | `mcpjungle` |
| `postgresql.auth.database` | PostgreSQL database | `mcpjungle` |
| `env.SERVER_MODE` | Server mode | `development` |
| `env.DATABASE_URL` | Database URL | `postgres://mcpjungle:mcpjungle@{{ .Release.Name }}-postgresql:5432/mcpjungle` |
| `mcpServers` | MCP servers configuration | See values.yaml |

## MCP Servers Configuration

The chart allows you to configure MCP servers through the `mcpServers` parameter in the values.yaml file. For example:

```yaml
mcpServers:
  calculator:
    name: calculator
    transport: streamable_http
    description: "Provides some basic math tools"
    url: "http://127.0.0.1:8000/mcp"
```

These configurations are stored in a ConfigMap and automatically registered with the MCPJungle server during installation via a post-installation hook. The ConfigMap is mounted at `/etc/mcpjungle/mcp-servers` in the MCPJungle container.

You can add additional MCP servers by updating the `mcpServers` section in your values.yaml file and upgrading the Helm release:

```bash
helm upgrade mcpjungle ./mcpjungle-chart
```

## Health Check

The deployment includes a health check that verifies the MCPJungle server is running properly. The health check endpoint is:

```
http://localhost:8080/health
```

## Ingress

The chart includes an Ingress resource to expose the MCPJungle server outside the cluster. By default, it's configured to use the NGINX Ingress Controller.
