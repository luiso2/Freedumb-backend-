# FREEDUMB - Deployment & Operations Guide
## Production Deployment, Monitoring, and Scaling

---

## 10. CONTAINERIZATION & ORCHESTRATION

### 10.1 Docker Configuration

#### **Docker Compose - Development Environment**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: freedumb-postgres
    environment:
      POSTGRES_USER: freedumb
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: freedumb_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U freedumb"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - freedumb-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: freedumb-redis
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - freedumb-network

  # MongoDB (for logs and AI data)
  mongodb:
    image: mongo:6
    container_name: freedumb-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: freedumb_logs
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - freedumb-network

  # RabbitMQ Message Queue
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: freedumb-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: freedumb
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - freedumb-network

  # Auth Service
  auth-service:
    build:
      context: ./services/auth
      dockerfile: Dockerfile
    container_name: freedumb-auth
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://freedumb:${POSTGRES_PASSWORD}@postgres:5432/freedumb_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - freedumb-network
    restart: unless-stopped

  # Transaction Service
  transaction-service:
    build:
      context: ./services/transaction
      dockerfile: Dockerfile
    container_name: freedumb-transaction
    environment:
      NODE_ENV: production
      PORT: 3002
      DATABASE_URL: postgresql://freedumb:${POSTGRES_PASSWORD}@postgres:5432/freedumb_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      RABBITMQ_URL: amqp://freedumb:${RABBITMQ_PASSWORD}@rabbitmq:5672
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - redis
      - rabbitmq
    networks:
      - freedumb-network
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # Budget Service
  budget-service:
    build:
      context: ./services/budget
      dockerfile: Dockerfile
    container_name: freedumb-budget
    environment:
      NODE_ENV: production
      PORT: 3003
      DATABASE_URL: postgresql://freedumb:${POSTGRES_PASSWORD}@postgres:5432/freedumb_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    ports:
      - "3003:3003"
    depends_on:
      - postgres
      - redis
    networks:
      - freedumb-network
    restart: unless-stopped

  # AI Service
  ai-service:
    build:
      context: ./services/ai
      dockerfile: Dockerfile
    container_name: freedumb-ai
    environment:
      NODE_ENV: production
      PORT: 3004
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      DATABASE_URL: postgresql://freedumb:${POSTGRES_PASSWORD}@postgres:5432/freedumb_db
      MONGODB_URL: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/freedumb_logs?authSource=admin
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    ports:
      - "3004:3004"
    depends_on:
      - postgres
      - mongodb
      - redis
    networks:
      - freedumb-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # Investment Service
  investment-service:
    build:
      context: ./services/investment
      dockerfile: Dockerfile
    container_name: freedumb-investment
    environment:
      NODE_ENV: production
      PORT: 3005
      DATABASE_URL: postgresql://freedumb:${POSTGRES_PASSWORD}@postgres:5432/freedumb_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      MARKET_DATA_API_KEY: ${MARKET_DATA_API_KEY}
      MARKET_DATA_API_URL: ${MARKET_DATA_API_URL}
    ports:
      - "3005:3005"
    depends_on:
      - postgres
      - redis
    networks:
      - freedumb-network
    restart: unless-stopped

  # Analytics Service
  analytics-service:
    build:
      context: ./services/analytics
      dockerfile: Dockerfile
    container_name: freedumb-analytics
    environment:
      NODE_ENV: production
      PORT: 3006
      DATABASE_URL: postgresql://freedumb:${POSTGRES_PASSWORD}@postgres:5432/freedumb_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    ports:
      - "3006:3006"
    depends_on:
      - postgres
      - redis
    networks:
      - freedumb-network
    restart: unless-stopped

  # Notification Service
  notification-service:
    build:
      context: ./services/notification
      dockerfile: Dockerfile
    container_name: freedumb-notification
    environment:
      NODE_ENV: production
      PORT: 3007
      DATABASE_URL: postgresql://freedumb:${POSTGRES_PASSWORD}@postgres:5432/freedumb_db
      RABBITMQ_URL: amqp://freedumb:${RABBITMQ_PASSWORD}@rabbitmq:5672
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
      TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
      TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
    ports:
      - "3007:3007"
    depends_on:
      - postgres
      - rabbitmq
    networks:
      - freedumb-network
    restart: unless-stopped

  # API Gateway (Nginx)
  api-gateway:
    image: nginx:alpine
    container_name: freedumb-gateway
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - auth-service
      - transaction-service
      - budget-service
      - ai-service
      - investment-service
      - analytics-service
    networks:
      - freedumb-network
    restart: unless-stopped

  # Background Workers
  worker-recurring:
    build:
      context: ./workers
      dockerfile: Dockerfile
    container_name: freedumb-worker-recurring
    command: node recurring-transaction-worker.js
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://freedumb:${POSTGRES_PASSWORD}@postgres:5432/freedumb_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - freedumb-network
    restart: unless-stopped

  worker-investment:
    build:
      context: ./workers
      dockerfile: Dockerfile
    container_name: freedumb-worker-investment
    command: node investment-price-worker.js
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://freedumb:${POSTGRES_PASSWORD}@postgres:5432/freedumb_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      MARKET_DATA_API_KEY: ${MARKET_DATA_API_KEY}
    depends_on:
      - postgres
      - redis
    networks:
      - freedumb-network
    restart: unless-stopped

  worker-notification:
    build:
      context: ./workers
      dockerfile: Dockerfile
    container_name: freedumb-worker-notification
    command: node notification-worker.js
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://freedumb:${POSTGRES_PASSWORD}@postgres:5432/freedumb_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - freedumb-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  mongo_data:
  rabbitmq_data:

networks:
  freedumb-network:
    driver: bridge
```

### 10.2 Service Dockerfile

```dockerfile
# services/transaction/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build stage (if using TypeScript)
# RUN npm run build

# Production image
FROM node:18-alpine

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "index.js"]
```

### 10.3 Nginx Configuration

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml application/atom+xml image/svg+xml
               text/x-component;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

    # Upstream services
    upstream auth_service {
        least_conn;
        server auth-service:3001 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream transaction_service {
        least_conn;
        server transaction-service:3002 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream budget_service {
        least_conn;
        server budget-service:3003 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream ai_service {
        least_conn;
        server ai-service:3004 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream investment_service {
        least_conn;
        server investment-service:3005 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream analytics_service {
        least_conn;
        server analytics-service:3006 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name api.freedumb.app;
        return 301 https://$server_name$request_uri;
    }

    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name api.freedumb.app;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Auth endpoints
        location /v1/auth {
            limit_req zone=auth_limit burst=5 nodelay;
            proxy_pass http://auth_service;
            include /etc/nginx/proxy_params.conf;
        }

        # Transaction endpoints
        location /v1/transactions {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://transaction_service;
            include /etc/nginx/proxy_params.conf;
        }

        location /v1/accounts {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://transaction_service;
            include /etc/nginx/proxy_params.conf;
        }

        location /v1/categories {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://transaction_service;
            include /etc/nginx/proxy_params.conf;
        }

        location /v1/recurring {
            limit_req zone=api_limit burst=10 nodelay;
            proxy_pass http://transaction_service;
            include /etc/nginx/proxy_params.conf;
        }

        # Budget endpoints
        location /v1/budgets {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://budget_service;
            include /etc/nginx/proxy_params.conf;
        }

        location /v1/goals {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://budget_service;
            include /etc/nginx/proxy_params.conf;
        }

        # AI endpoints
        location /v1/ai {
            limit_req zone=api_limit burst=10 nodelay;
            proxy_pass http://ai_service;
            proxy_read_timeout 60s;
            include /etc/nginx/proxy_params.conf;
        }

        # Investment endpoints
        location /v1/portfolios {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://investment_service;
            include /etc/nginx/proxy_params.conf;
        }

        location /v1/holdings {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://investment_service;
            include /etc/nginx/proxy_params.conf;
        }

        # Analytics endpoints
        location /v1/analytics {
            limit_req zone=api_limit burst=10 nodelay;
            proxy_pass http://analytics_service;
            proxy_read_timeout 120s;
            include /etc/nginx/proxy_params.conf;
        }

        location /v1/reports {
            limit_req zone=api_limit burst=5 nodelay;
            proxy_pass http://analytics_service;
            proxy_read_timeout 300s;
            include /etc/nginx/proxy_params.conf;
        }

        # WebSocket endpoint
        location /ws {
            proxy_pass http://websocket_service;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_read_timeout 86400;
        }
    }
}
```

```nginx
# nginx/proxy_params.conf
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Connection "";

# Timeouts
proxy_connect_timeout 30s;
proxy_send_timeout 30s;
proxy_read_timeout 30s;

# Buffering
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

---

## 11. KUBERNETES DEPLOYMENT

### 11.1 Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: freedumb
```

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: freedumb-config
  namespace: freedumb
data:
  NODE_ENV: "production"
  DATABASE_HOST: "postgres-service"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "freedumb_db"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  RABBITMQ_HOST: "rabbitmq-service"
  RABBITMQ_PORT: "5672"
```

```yaml
# k8s/secrets.yaml (use sealed-secrets or external secrets in production)
apiVersion: v1
kind: Secret
metadata:
  name: freedumb-secrets
  namespace: freedumb
type: Opaque
stringData:
  POSTGRES_PASSWORD: "your-postgres-password"
  REDIS_PASSWORD: "your-redis-password"
  JWT_ACCESS_SECRET: "your-jwt-access-secret"
  JWT_REFRESH_SECRET: "your-jwt-refresh-secret"
  OPENAI_API_KEY: "your-openai-key"
  ENCRYPTION_KEY: "your-encryption-key-hex"
```

```yaml
# k8s/deployments/transaction-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: transaction-service
  namespace: freedumb
  labels:
    app: transaction-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: transaction-service
  template:
    metadata:
      labels:
        app: transaction-service
    spec:
      containers:
      - name: transaction-service
        image: freedumb/transaction-service:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3002
          name: http
        env:
        - name: PORT
          value: "3002"
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: freedumb-config
              key: NODE_ENV
        - name: DATABASE_URL
          value: "postgresql://$(DATABASE_USER):$(POSTGRES_PASSWORD)@$(DATABASE_HOST):$(DATABASE_PORT)/$(DATABASE_NAME)"
        - name: DATABASE_HOST
          valueFrom:
            configMapKeyRef:
              name: freedumb-config
              key: DATABASE_HOST
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: freedumb-secrets
              key: POSTGRES_PASSWORD
        - name: REDIS_URL
          value: "redis://:$(REDIS_PASSWORD)@$(REDIS_HOST):$(REDIS_PORT)"
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: freedumb-secrets
              key: REDIS_PASSWORD
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
---
apiVersion: v1
kind: Service
metadata:
  name: transaction-service
  namespace: freedumb
spec:
  selector:
    app: transaction-service
  ports:
  - protocol: TCP
    port: 3002
    targetPort: 3002
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: transaction-service-hpa
  namespace: freedumb
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: transaction-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: freedumb-ingress
  namespace: freedumb
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/limit-rps: "10"
spec:
  tls:
  - hosts:
    - api.freedumb.app
    secretName: freedumb-tls
  rules:
  - host: api.freedumb.app
    http:
      paths:
      - path: /v1/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 3001
      - path: /v1/transactions
        pathType: Prefix
        backend:
          service:
            name: transaction-service
            port:
              number: 3002
      - path: /v1/budgets
        pathType: Prefix
        backend:
          service:
            name: budget-service
            port:
              number: 3003
      - path: /v1/ai
        pathType: Prefix
        backend:
          service:
            name: ai-service
            port:
              number: 3004
      - path: /v1/portfolios
        pathType: Prefix
        backend:
          service:
            name: investment-service
            port:
              number: 3005
      - path: /v1/analytics
        pathType: Prefix
        backend:
          service:
            name: analytics-service
            port:
              number: 3006
```

---

## 12. MONITORING & OBSERVABILITY

### 12.1 Prometheus Metrics

```javascript
// middleware/metricsMiddleware.js
const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeTransactions = new promClient.Gauge({
  name: 'active_transactions',
  help: 'Number of active database transactions'
});

const cacheHitRate = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_key_prefix']
});

const cacheMissRate = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_key_prefix']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeTransactions);
register.registerMetric(cacheHitRate);
register.registerMetric(cacheMissRate);

// Middleware to track requests
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });

  next();
};

// Metrics endpoint
const metricsEndpoint = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    activeTransactions,
    cacheHitRate,
    cacheMissRate
  }
};
```

### 12.2 Structured Logging with Winston

```javascript
// services/logger/Logger.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'freedumb-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // File output
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Add Elasticsearch transport in production
if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
  logger.add(new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        username: process.env.ELASTICSEARCH_USER,
        password: process.env.ELASTICSEARCH_PASSWORD
      }
    },
    index: 'freedumb-logs'
  }));
}

// Helper methods
logger.logRequest = (req, meta = {}) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.userId,
    ...meta
  });
};

logger.logError = (error, meta = {}) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...meta
  });
};

logger.logTransaction = (action, userId, data = {}) => {
  logger.info('Transaction', {
    action,
    userId,
    ...data
  });
};

module.exports = logger;
```

### 12.3 Distributed Tracing with OpenTelemetry

```javascript
// services/tracing/tracer.js
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');
const { RedisInstrumentation } = require('@opentelemetry/instrumentation-redis-4');

function initTracing(serviceName) {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
    })
  });

  // Configure Jaeger exporter
  const jaegerExporter = new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
  });

  provider.addSpanProcessor(new BatchSpanProcessor(jaegerExporter));
  provider.register();

  // Register instrumentations
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
      new RedisInstrumentation()
    ]
  });

  console.log(`Tracing initialized for ${serviceName}`);
}

module.exports = { initTracing };
```

---

*Continuará con CI/CD y conclusiones finales...*
