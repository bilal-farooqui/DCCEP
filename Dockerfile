# Use official Node.js image
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY user-service ./user-service
COPY product-service ./product-service
COPY order-service ./order-service
COPY payment-service ./payment-service
COPY api-gateway ./api-gateway

# Set permissions for Hugging Face non-root user (UID 1000)
RUN chmod -R 777 /app

# Install root dependencies
RUN npm install

# Install dependencies for all microservices
RUN npm run install:all

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
