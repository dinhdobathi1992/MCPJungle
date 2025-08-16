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
| `env.SERVER_MODE` | Server mode | `production` |
| `env.DATABASE_URL` | Database URL | `sqlite:///data/mcpjungle.db` |
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
  
  terraform:
    name: "terraform-mcp-server"
    transport: "streamable_http"
    description: "Terraform infrastructure management tools"
    url: "http://terraform-mcp-server.mcp.svc.cluster.local:8080/mcp"
```

These configurations are stored in a ConfigMap and automatically registered with the MCPJungle server during installation via a post-installation hook.

## Post-Install Job: Sequential MCP Server Registration & Client Creation

The Helm chart includes an **advanced post-install job** that automatically handles the complete setup of your MCPJungle instance. This job uses a custom CLI image with `kubectl` and `mcpjungle` binaries for robust operation.

### Job Architecture & Components

#### Init Container: Server Initialization
- **Image**: `dinhdobathi/mcpjungle-cli:latest` (multi-arch: amd64/arm64)
- **Components**: MCPJungle CLI + kubectl + curl + tar + jq + file utilities
- **Purpose**: 
  - Wait for MCPJungle server health
  - Initialize server in production mode (creates admin user)
  - Store admin credentials in Kubernetes Secret for persistence
  - Verify server connectivity

#### Main Container: Sequential Operations
1. **MCP Server Registration**
2. **MCP Client Creation** (production mode only)

### How the Sequential Process Works

#### Step 1: Server Initialization (Init Container)
```bash
# Wait for server health
until curl -s http://mcpjungle:8080/health; do sleep 5; done

# Production mode: Initialize server & store admin token
if SERVER_MODE=production; then
  # Check for existing admin token in Kubernetes Secret
  if kubectl get secret mcpjungle-admin-token; then
    # Restore existing admin config
    kubectl get secret mcpjungle-admin-token -o jsonpath='{.data.mcpjungle\.conf}' | base64 -d > ~/.mcpjungle.conf
  else
    # Initialize new server & store admin token
    mcpjungle init-server --registry http://mcpjungle:8080
    kubectl create secret generic mcpjungle-admin-token --from-file=mcpjungle.conf=~/.mcpjungle.conf
  fi
fi
```

#### Step 2: MCP Server Registration (Main Container)
```bash
# Restore admin credentials from Kubernetes Secret
kubectl get secret mcpjungle-admin-token -o jsonpath='{.data.mcpjungle\.conf}' | base64 -d > ~/.mcpjungle.conf

# Register all MCP servers
for file in /etc/mcpjungle/mcp-servers/*.json; do
  mcpjungle register -c "$file" --registry http://mcpjungle:8080
done

# Verify registration
mcpjungle list servers --registry http://mcpjungle:8080
```

#### Step 3: MCP Client Creation (Main Container - Production Only)
```bash
# Extract registered server names
servers_list=$(mcpjungle list servers --registry http://mcpjungle:8080 | grep -E "^[0-9]+\. " | sed 's/^[0-9]*\. //' | paste -sd, -)

# Create default client with access to all servers
mcpjungle create mcp-client default-client --allow "$servers_list" --registry http://mcpjungle:8080

# Extract and store access token
access_token=$(echo "$client_output" | grep "Access token:" | sed 's/.*Access token: //' | awk '{print $1}')
echo "$access_token" > /shared/client-access-token.txt
```

### Admin Token Persistence

**Problem Solved**: Admin tokens now persist across Helm upgrades using Kubernetes Secrets.

- **First Install**: Creates admin user and stores credentials in `mcpjungle-admin-token` Secret
- **Upgrades**: Reuses existing admin credentials from Secret
- **Benefits**: No lost access, seamless upgrades, proper authentication flow

### RBAC Permissions

The chart includes proper RBAC configuration for secret management:

```yaml
# Role: mcpjungle-secrets-manager
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "create", "update", "patch"]
```

### Multi-Architecture Support

The job automatically detects container architecture and works on both:
- **ARM64** (Apple Silicon, ARM-based nodes)
- **x86_64** (Intel/AMD processors)

### Development vs Production Mode

#### Development Mode (`SERVER_MODE: development`)
- No authentication required
- All MCP clients have full access
- Simplified setup for testing

#### Production Mode (`SERVER_MODE: production`)
- **Authentication required** for all operations
- **Admin user** created during initialization
- **Access control** enforced via client tokens
- **Automatic client creation** with secure tokens

## Monitoring the Registration Process

### Check Job Status
```bash
# View job completion status
kubectl get jobs -l app.kubernetes.io/name=mcpjungle

# Check init container logs (server initialization)
kubectl logs job/mcpjungle-register-mcp-servers -c init-mcpjungle

# Check main container logs (registration & client creation)
kubectl logs job/mcpjungle-register-mcp-servers -c register-and-create
```

### Verify Server Registration
```bash
# List registered servers
kubectl exec deployment/mcpjungle -- mcpjungle list servers

# Test server connectivity
curl http://mcpjungle:8080/health
```

## Production Mode: MCP Client Management

### Automatic Client Creation

In production mode, the post-install job automatically:
1. **Creates** a `default-client` with access to all registered servers
2. **Generates** a secure access token
3. **Stores** the token for retrieval

### Retrieving the Access Token

```bash
# Method 1: From job logs
kubectl logs job/mcpjungle-register-mcp-servers -c register-and-create | grep "Access token:"

# Method 2: From stored file (if job pod exists)
kubectl exec -it $(kubectl get pods -l job-name=mcpjungle-register-mcp-servers -o jsonpath='{.items[0].metadata.name}') -c register-and-create -- cat /shared/client-access-token.txt

# Method 3: Check admin secret (for debugging)
kubectl get secret mcpjungle-admin-token -o yaml
```

### Using the Access Token

```bash
# List available tools
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://mcpjungle:8080/mcp/list_tools

# Example with actual token
curl -H "Authorization: Bearer U8ivYtbnoeYRvKJAbdgAcb5YN3pu5pKwQPmDesFPZGs" \
  http://mcpjungle.default.svc.cluster.local:8080/mcp/list_tools
```

### Manual Client Creation

```bash
# Create additional clients with specific permissions
kubectl exec deployment/mcpjungle -- \
  mcpjungle create mcp-client cursor-local --allow "terraform-mcp-server"

kubectl exec deployment/mcpjungle -- \
  mcpjungle create mcp-client claude-desktop --allow "calculator,terraform-mcp-server"
```

## Adding New MCP Servers

Update `values.yaml` and upgrade:

```yaml
mcpServers:
  # Existing servers...
  calculator:
    name: calculator
    transport: streamable_http
    description: "Provides some basic math tools"
    url: "http://127.0.0.1:8000/mcp"
  
  # Add new server
  github:
    name: "github-mcp-server"
    transport: "streamable_http"
    description: "GitHub repository management"
    url: "http://github-mcp-server.tools.svc.cluster.local:8080/mcp"
```

```bash
# Apply changes
helm upgrade mcpjungle ./mcpjungle-chart

# Verify new server registration
kubectl logs job/mcpjungle-register-mcp-servers -c register-and-create
```

## Troubleshooting

### Common Issues

#### 1. kubectl not found
**Symptom**: `kubectl: not found` in job logs
**Solution**: Use the latest `dinhdobathi/mcpjungle-cli:latest` image (includes kubectl)

#### 2. Admin token not found
**Symptom**: `No admin config found in shared volume`
**Solution**: Check RBAC permissions and Secret existence
```bash
kubectl get secrets | grep mcpjungle-admin-token
kubectl get rolebinding mcpjungle-secrets-manager
```

#### 3. Server list parsing errors
**Symptom**: `No MCP servers found` but servers are registered
**Solution**: Check the parsing logic handles your server output format
```bash
# Test parsing manually
kubectl exec deployment/mcpjungle -- mcpjungle list servers | grep -E "^[0-9]+\. "
```

#### 4. Client creation fails
**Symptom**: Access token extraction returns empty or wrong value
**Solution**: Verify the output format and adjust parsing
```bash
# Check actual client creation output
kubectl logs job/mcpjungle-register-mcp-servers -c register-and-create | grep -A5 -B5 "Access token:"
```

### Debug Commands

```bash
# Get detailed job information
kubectl describe job mcpjungle-register-mcp-servers

# Check job pod events
kubectl get events --field-selector involvedObject.name=mcpjungle-register-mcp-servers

# Manual cleanup and retry
kubectl delete job mcpjungle-register-mcp-servers
helm upgrade mcpjungle ./mcpjungle-chart

# Access job pod for debugging
kubectl exec -it $(kubectl get pods -l job-name=mcpjungle-register-mcp-servers -o jsonpath='{.items[0].metadata.name}') -- sh
```

### Manual Recovery

If automatic processes fail, you can manually recover:

```bash
# 1. Initialize server manually
kubectl exec deployment/mcpjungle -- mcpjungle init-server

# 2. Register servers manually
kubectl exec deployment/mcpjungle -- mcpjungle register -c /etc/mcpjungle/mcp-servers/terraform.json

# 3. Create client manually
kubectl exec deployment/mcpjungle -- mcpjungle create mcp-client manual-client --allow "terraform-mcp-server"
```

## Health Check

The deployment includes comprehensive health checks:

```bash
# Server health endpoint
curl http://mcpjungle:8080/health

# Kubernetes health checks
kubectl get pods -l app.kubernetes.io/name=mcpjungle
kubectl describe pod -l app.kubernetes.io/name=mcpjungle
```

## Ingress

The chart includes an Ingress resource to expose MCPJungle outside the cluster:

```yaml
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: mcpjungle.local
      paths:
        - path: /
          pathType: Prefix
```

Access your MCPJungle instance at: `http://mcpjungle.local`

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCPJungle Helm Chart                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   Deployment    │    │   ConfigMap     │                    │
│  │   mcpjungle     │    │  mcp-servers    │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │    Service      │    │     Secret      │                    │
│  │   mcpjungle     │    │ admin-token     │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Post-Install Job                               │ │
│  │  ┌─────────────┐  ┌─────────────┐                          │ │
│  │  │Init Container│  │Main Container│                         │ │
│  │  │   Server    │  │Registration  │                         │ │
│  │  │Initialization│  │& Client      │                         │ │
│  │  │             │  │Creation      │                         │ │
│  │  └─────────────┘  └─────────────┘                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

This comprehensive setup ensures a production-ready MCPJungle deployment with proper authentication, persistence, and automated management! 🚀