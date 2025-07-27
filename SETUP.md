# WireViz Chat App Setup Guide

## Prerequisites

- **Python 3.7+** with pip
- **Node.js 18+** with npm
- **GraphViz** (required by WireViz)

### Install GraphViz

**macOS:**
```bash
brew install graphviz
```

**Ubuntu/Debian:**
```bash
sudo apt-get install graphviz
```

**Windows:**
Download from https://graphviz.org/download/

## Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create and activate virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

5. **Start the backend server:**
```bash
python main.py
```

The backend will run on http://localhost:8000

## Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

The frontend will run on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Use the chat interface on the left to describe your wiring needs
3. Edit the generated YAML in the middle panel
4. View the live diagram preview on the right

## Example Prompts

Try these example prompts in the chat:

- "Create a simple cable connecting a 9-pin D-Sub connector to a 4-pin Molex connector"
- "I need a USB cable with proper color coding"
- "Design a power distribution harness with 3 outputs"
- "Create a serial communication cable between two devices"

## Troubleshooting

### WireViz not found
If you get "WireViz not found" error, install it manually:
```bash
pip install wireviz
```

### GraphViz errors
Make sure GraphViz is properly installed and in your system PATH.

### CORS errors
Ensure the backend is running on port 8000 and the frontend on port 3000.

### LLM API errors
Check your OpenAI API key in the `.env` file.