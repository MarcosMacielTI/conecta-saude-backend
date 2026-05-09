# Docker Security Configuration for Conecta Saúde Backend

## Security Best Practices Implemented

### 1. Base Image Security
- Updated to Node.js 20 LTS on Alpine 3.18
- Alpine Linux provides minimal attack surface
- Regular security updates available

### 2. User Security
- Non-root user execution (nextjs:nodejs)
- Proper file ownership and permissions
- No privilege escalation possible

### 3. Container Hardening
- `no-new-privileges:true` prevents privilege escalation
- Read-only filesystem with tmpfs for /tmp
- Minimal required packages installed

### 4. Network Security
- Isolated Docker network
- No unnecessary port exposures
- Proper service dependencies

### 5. Application Security
- Production NODE_ENV
- Health checks for container monitoring
- Proper signal handling with dumb-init

### 6. Build Security
- Optimized .dockerignore prevents sensitive files
- Multi-stage build considerations
- Minimal final image size

## Monitoring & Compliance

- Health checks every 30 seconds
- Automatic container restart on failure
- Comprehensive logging to ./logs directory
- Database connection monitoring

## Recommendations for Production

1. **Secrets Management**: Use Docker secrets or external secret managers
2. **Image Scanning**: Regularly scan images for vulnerabilities
3. **Resource Limits**: Set CPU and memory limits in docker-compose.yml
4. **Logging**: Implement centralized logging
5. **Updates**: Regularly update base images and dependencies

## Quick Security Audit

Run this command to check for common issues:
```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  goodwithtech/dockle:v0.4.14 \
  conecta_saude_app:latest
```