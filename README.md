# WireViz Chat App

An LLM-powered interactive tool for creating wiring and cabling visualizations using natural language input.

## Features

- 🤖 Natural language chat interface for describing wiring requirements
- 📝 Interactive YAML editor with syntax highlighting
- 👁️ Real-time diagram preview (SVG/PNG)
- 📋 Automatic Bill of Materials generation
- 🔄 Live updates as you edit
- 📚 Template library for common wiring patterns

## Architecture

- **Frontend**: React + TypeScript + Monaco Editor
- **Backend**: Python FastAPI + WireViz integration
- **LLM**: OpenAI/Anthropic API integration
- **Real-time**: WebSocket communication

## Setup

### Backend (Python)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
wireviz-chat-app/
├── frontend/          # React TypeScript app
├── backend/           # Python FastAPI server
├── shared/            # Shared types and utilities
└── README.md
```