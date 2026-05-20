import subprocess
import os
import sys
import urllib.request
import tarfile
import shutil

print("=== Starting Hugging Face Gradio/Node.js Wrapper ===")

NODE_DIR = os.path.join(os.getcwd(), "node_bin")

def ensure_node():
    node_bin_path = os.path.join(NODE_DIR, "bin")
    node_path = os.path.join(node_bin_path, "node")
    npm_path = os.path.join(node_bin_path, "npm")
    
    # Check if already installed
    if os.path.exists(node_path) and os.path.exists(npm_path):
        print(f"Local Node.js already exists at: {node_path}")
        os.environ["PATH"] = f"{node_bin_path}{os.path.pathsep}{os.environ.get('PATH', '')}"
        return

    print("Node.js/NPM not found. Downloading precompiled Linux x64 binary...")
    url = "https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz"
    archive_path = os.path.join(os.getcwd(), "node.tar.xz")
    
    try:
        # Download Node.js
        urllib.request.urlretrieve(url, archive_path)
        print("Downloaded Node.js archive.")
        
        # Extract archive
        print("Extracting Node.js archive...")
        with tarfile.open(archive_path, "r:xz") as tar:
            tar.extractall(path=os.getcwd())
            
        # Rename the extracted folder to NODE_DIR
        extracted_folder = os.path.join(os.getcwd(), "node-v18.19.0-linux-x64")
        if os.path.exists(NODE_DIR):
            shutil.rmtree(NODE_DIR)
        os.rename(extracted_folder, NODE_DIR)
        print(f"Node.js successfully extracted to {NODE_DIR}")
        
        # Clean up archive file
        if os.path.exists(archive_path):
            os.remove(archive_path)
        
    except Exception as e:
        print(f"Failed to download or extract Node.js: {e}", file=sys.stderr)
        sys.exit(1)

    # Inject Node.js bin directory into PATH environment variable
    os.environ["PATH"] = f"{node_bin_path}{os.path.pathsep}{os.environ.get('PATH', '')}"

# Execute Node.js bootstrap
ensure_node()

# Verify the installed node and npm versions
try:
    node_version = subprocess.check_output(["node", "--version"]).decode().strip()
    npm_version = subprocess.check_output(["npm", "--version"]).decode().strip()
    print(f"Successfully configured Node.js: {node_version}")
    print(f"Successfully configured NPM: {npm_version}")
except Exception as e:
    print(f"Failed to run node/npm after path configuration: {e}", file=sys.stderr)
    sys.exit(1)

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
