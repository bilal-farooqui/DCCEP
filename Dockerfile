# Use official Node.js image
FROM node:18-alpine

WORKDIR /app

# Copy files with node user ownership (UID 1000)
COPY --chown=node:node package.json package-lock.json* ./
COPY --chown=node:node user-service ./user-service
COPY --chown=node:node product-service ./product-service
COPY --chown=node:node order-service ./order-service
COPY --chown=node:node payment-service ./payment-service
COPY --chown=node:node api-gateway ./api-gateway

# Switch to node user (UID 1000) - Hugging Face runs as UID 1000
USER node

# Install root dependencies
RUN npm install

# Install dependencies for all microservices
RUN npm run install:backend

# Set environment variables for microservices internal routing
ENV PORT=7860
ENV NODE_ENV=production
ENV USER_SERVICE_URL=http://localhost:5001
ENV PRODUCT_SERVICE_URL=http://localhost:5002
ENV ORDER_SERVICE_URL=http://localhost:5003
ENV PAYMENT_SERVICE_URL=http://localhost:5004

# Hugging Face default port is 7860
EXPOSE 7860

CMD ["npm", "run", "start:prod:backend"]
