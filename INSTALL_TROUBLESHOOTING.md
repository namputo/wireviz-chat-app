# Installation Troubleshooting

## WireViz Installation Issues on Windows

The Rust error you're seeing is from a dependency that requires compilation. Here are several solutions:

### Option 1: Install Pre-compiled WireViz (Recommended)
Try installing WireViz without dependencies that require compilation:

```bash
pip install --no-deps wireviz==0.4.1
pip install pyyaml graphviz pillow
```

### Option 2: Use Conda (If you have Anaconda/Miniconda)
```bash
conda install -c conda-forge wireviz
```

### Option 3: Install Rust Manually
If you want the full installation with all features:

1. **Install Rust from https://rustup.rs/**
2. **Restart your terminal/command prompt**
3. **Verify Rust is installed:**
   ```bash
   rustc --version
   cargo --version
   ```
4. **Then install WireViz:**
   ```bash
   pip install wireviz==0.4.1
   ```

### Option 4: Alternative Backend Dependencies
Create a minimal requirements file for testing:

```bash
# Save as requirements-minimal.txt
fastapi==0.104.1
uvicorn==0.24.0
websockets==12.0
python-multipart==0.0.6
pydantic==2.5.0
openai==1.3.7
anthropic==0.7.8
python-dotenv==1.0.0
aiofiles==23.2.1
# Skip WireViz for now - install separately
```

## Testing Without WireViz
You can test the chat functionality first without WireViz:

1. **Install basic requirements:**
   ```bash
   pip install fastapi uvicorn openai anthropic python-dotenv
   ```

2. **Start the backend server:**
   ```bash
   python main.py
   ```

3. **Test the chat interface** - it will work for YAML generation, just not diagram rendering

## GraphViz Installation (Required for WireViz)
Make sure GraphViz is properly installed:

**Windows:**
- Download from https://graphviz.org/download/
- Add to system PATH
- Or use chocolatey: `choco install graphviz`

**Verify GraphViz:**
```bash
dot -V
```

## Alternative: Docker Setup
If installation issues persist, consider using Docker:

```dockerfile
# Dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    graphviz \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY . /app
WORKDIR /app

CMD ["python", "main.py"]
```

## Quick Test
To verify your setup is working:

```python
# test_wireviz.py
try:
    import wireviz
    print("✅ WireViz imported successfully")
    print(f"WireViz version: {wireviz.__version__}")
except ImportError as e:
    print(f"❌ WireViz import failed: {e}")

try:
    import graphviz
    print("✅ GraphViz available")
except ImportError:
    print("❌ GraphViz not available")
```