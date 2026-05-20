# Cloud Deployment Guide (Hugging Face Spaces & Vercel)

Since Render requires a debit/credit card verification even for their free tier, we will use **Hugging Face Spaces** to deploy the backend microservices. Hugging Face Spaces is **100% free, requires zero payment card details**, and supports custom Docker containers.

Instead of deploying 5 separate services, we have configured a unified **root Dockerfile** that launches all 5 backend components (API Gateway + 4 Microservices) concurrently inside a single Hugging Face Space.

---

## Step 1: Prepare MongoDB Atlas (Cloud)
To allow Hugging Face containers to connect to your MongoDB Atlas database:
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Navigate to **Network Access** under the Security tab.
3. Click **Add IP Address**.
4. Choose **Allow Access from Anywhere** (IP `0.0.0.0/0`) and click **Confirm**.

---

## Step 2: Deploy Backend to Hugging Face Spaces (FREE)

1. Log in or sign up at [Hugging Face](https://huggingface.co/).
2. Click on your profile icon (top right) and select **New Space**.
3. Fill in the Space settings:
   - **Space Name:** `cep-developer-store-backend` (or any custom name)
   - **SDK:** Select **Docker** (very important!).
   - **Docker Template:** Select **Blank**.
   - **Space License:** `mit` (or any license).
   - **Visibility:** **Public** (required for Vercel frontend to reach it).
4. Click **Create Space**.

### Configure Environment Variables (Variables)
Hugging Face allows you to store your database URLs securely as environment variables.
1. In your newly created Space, click on the **Settings** tab.
2. Scroll down to **Variables and secrets**.
3. Under **Variables** (NOT Secrets, so it is accessible during build/run easily), click **New variable**.
4. Set the following:
   - **Name:** `MONGODB_URI`
   - **Value:** `mongodb+srv://admin:1234@dccep.uluhhbu.mongodb.net` (Use your base MongoDB URL, **WITHOUT** any database name like `/dc_product_db` at the end and without trailing slash).
   * *Note: Our custom start script will automatically append the respective database name (`/dc_user_db`, `/dc_product_db`, etc.) for each microservice dynamically!*

### Push the Code to Hugging Face
Hugging Face Spaces act as a standard Git repository. You can push your local folder directly:
1. Copy the Git remote command from your Space homepage. It looks like:
   ```bash
   git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
   ```
2. Run this remote add command in your root directory.
3. Add, commit, and push your code:
   ```bash
   git add .
   git commit -m "Configure Hugging Face Docker deployment"
   git push hf main --force
   ```
4. Hugging Face will automatically detect the root `Dockerfile` we created, compile the dependencies, and start the unified backend microservices!

Once the build is complete (status changes to **Running**), your API Gateway is live at:
`https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space` (e.g. `https://bilal-cep-developer-store-backend.hf.space`)

---

## Step 3: Deploy Frontend to Vercel (FREE)

### A. Point Frontend to Hugging Face URL
Our frontend uses `import.meta.env.VITE_API_URL` to route requests. We will configure Vercel to pass your Hugging Face Space URL.

### B. Deploying on Vercel
1. Log in to [Vercel](https://vercel.com/) (Sign up via GitHub).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Set configurations:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
5. Expand **Environment Variables** and add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space` (Your live Hugging Face Space URL)
6. Click **Deploy**.

---

## Production Communication Architecture
All elements are now live in the cloud:

```
[ Vercel Frontend ]
       │
       ▼ (Hits live Gateway URL on Hugging Face over HTTPs)
[ Hugging Face Space (API Gateway - Port 7860) ]
       │
       ├── Proxies internally to user-service (Port 5001)
       ├── Proxies internally to product-service (Port 5002)
       ├── Proxies internally to order-service (Port 5003)
       └── Proxies internally to payment-service (Port 5004)
```
