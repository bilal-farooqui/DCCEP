import subprocess
import os
import sys

print("=== Starting Hugging Face Gradio/Node.js Wrapper ===")

# Verify Node.js and NPM availability
try:
    node_version = subprocess.check_output(["node", "--version"]).decode().strip()
    npm_version = subprocess.check_output(["npm", "--version"]).decode().strip()
    print(f"Node.js version: {node_version}")
    print(f"NPM version: {npm_version}")
except Exception as e:
    print("Error finding Node.js or NPM. Installing local Node.js...", file=sys.stderr)
    # Fallback: Download node binary if needed, but it should be preinstalled.

# Environment configuration
os.environ["PORT"] = "7860"
os.environ["NODE_ENV"] = "production"
os.environ["USER_SERVICE_URL"] = "http://localhost:5001"
os.environ["PRODUCT_SERVICE_URL"] = "http://localhost:5002"
os.environ["ORDER_SERVICE_URL"] = "http://localhost:5003"
os.environ["PAYMENT_SERVICE_URL"] = "http://localhost:5004"

# Step 1: Install root and sub-microservice dependencies
print("Installing dependencies...")
try:
    # Run npm install in root
    subprocess.run(["npm", "install"], check=True)
    # Run backend subfolders installations
    subprocess.run(["npm", "run", "install:backend"], check=True)
    print("Dependencies installed successfully.")
except subprocess.CalledProcessError as e:
    print(f"Dependency installation failed: {e}", file=sys.stderr)
    sys.exit(1)

# Step 2: Start the microservices concurrently
print("Launching Node.js backend microservices...")
try:
    # We run the concurrently start script
    process = subprocess.Popen(["npm", "run", "start:prod:backend"])
    process.wait()
except Exception as e:
    print(f"Execution failed: {e}", file=sys.stderr)
    sys.exit(1)
