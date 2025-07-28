from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import json
import asyncio
from typing import Dict, List
import os
from dotenv import load_dotenv

from services.wireviz_service import WireVizService
from services.llm_service import LLMService
from models.schemas import ChatMessage, WireVizRequest, WireVizResponse

load_dotenv()

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="WireViz Chat App", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
wireviz_service = WireVizService()
llm_service = LLMService()

# WebSocket connections
active_connections: List[WebSocket] = []

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "WireViz Chat App API"}

@app.post("/api/chat")
@limiter.limit("10/minute")
async def chat_endpoint(request: Request, message: ChatMessage):
    """Process chat message and return LLM response with WireViz YAML"""
    try:
        response = await llm_service.process_message(message.content, message.current_yaml)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-diagram", response_model=WireVizResponse)
@limiter.limit("30/minute")
async def generate_diagram(request: Request, wireviz_request: WireVizRequest):
    """Generate diagram from WireViz YAML"""
    try:
        result = await wireviz_service.generate_diagram(wireviz_request.yaml_content, wireviz_request.format)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "yaml_update":
                # Process YAML and generate diagram
                yaml_content = message_data["content"]
                try:
                    result = await wireviz_service.generate_diagram(yaml_content)
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "diagram_update",
                            "success": True,
                            "data": result.dict()
                        }), 
                        websocket
                    )
                except Exception as e:
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "diagram_update",
                            "success": False,
                            "error": str(e)
                        }), 
                        websocket
                    )
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)