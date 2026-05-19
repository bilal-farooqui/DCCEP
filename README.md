# CEP DC Microservices

A microservices-based e-commerce application.

## Folder Structure
- `user-service/`: Node.js + Express + MongoDB (Port 5001)
- `product-service/`: Node.js + Express + MongoDB (Port 5002)
- `order-service/`: Node.js + Express + MongoDB (Port 5003)
- `frontend/`: React + Vite
- `docs/`: Design and Analysis documents

## Getting Started

### Backend Services
1. Navigate to each service folder:
   ```bash
   cd user-service # or product-service, order-service
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (templates provided).
4. Start the service:
   ```bash
   npm run dev
   ```

### Frontend
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
