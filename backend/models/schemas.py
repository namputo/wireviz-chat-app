from pydantic import BaseModel
from typing import Optional, Dict, Any
from enum import Enum

class DiagramFormat(str, Enum):
    SVG = "svg"
    PNG = "png"
    HTML = "html"

class ChatMessage(BaseModel):
    content: str
    current_yaml: Optional[str] = None
    timestamp: Optional[str] = None

class WireVizRequest(BaseModel):
    yaml_content: str
    format: DiagramFormat = DiagramFormat.SVG

class WireVizResponse(BaseModel):
    success: bool
    diagram_data: Optional[str] = None
    bom_data: Optional[str] = None
    error: Optional[str] = None
    format: DiagramFormat

class LLMResponse(BaseModel):
    content: str
    yaml_generated: Optional[str] = None
    suggestions: Optional[list] = None