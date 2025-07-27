import openai
import anthropic
import os
from typing import Optional
from models.schemas import LLMResponse

class LLMService:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        
        # Use Anthropic if available, otherwise fall back to OpenAI
        if self.anthropic_key:
            self.client = anthropic.Anthropic(api_key=self.anthropic_key)
            self.provider = "anthropic"
        elif self.openai_key:
            self.client = openai.OpenAI(api_key=self.openai_key)
            self.provider = "openai"
        else:
            raise ValueError("Either ANTHROPIC_API_KEY or OPENAI_API_KEY must be set")
        self.system_prompt = """You are an expert in electrical wiring and the WireViz tool. 
        WireViz uses YAML format to describe wiring diagrams. Help users create WireViz YAML configurations 
        based on their natural language descriptions.

        Key WireViz YAML structure:
        - connectors: Define electrical connectors with pins
        - cables: Define cables with wires
        - connections: Define how connectors and cables connect

        Example WireViz YAML:
        ```yaml
        connectors:
          X1:
            type: D-Sub
            subtype: female
            pincount: 9
            pins: [1, 2, 3, 4, 5, 6, 7, 8, 9]
          X2:
            type: Molex KK
            subtype: female
            pincount: 4
            pins: [1, 2, 3, 4]

        cables:
          W1:
            gauge: 22 AWG
            length: 0.2
            color_code: DIN
            wirecount: 4
            shield: true

        connections:
          - 
            - X1: [1, 2, 3, 4]
            - W1: [1, 2, 3, 4]
            - X2: [1, 2, 3, 4]
        ```

        IMPORTANT BEHAVIOR:
        - If the user provides existing YAML, modify or extend it rather than replacing it completely
        - For additions like "add another connector", add to the existing structure
        - For modifications like "change X1 to 6 pins", modify only the specified part
        - Only provide a complete new YAML if the user is starting fresh or asks for a complete replacement
        - Always preserve existing connectors, cables, and connections unless specifically asked to change them
        
        RESPONSE FORMAT:
        - Provide a friendly explanation of what you're doing
        - Do NOT include the raw YAML in your conversational response
        - Only provide the YAML in code blocks for the system to extract
        - Be conversational and explain your changes in simple terms
        - Example: "I'll add a USB connector with 4 pins and connect it to your existing cable W1."
        
        Keep responses concise and friendly, focusing on what you're changing rather than showing the code."""
    
    async def process_message(self, user_message: str, current_yaml: Optional[str] = None) -> LLMResponse:
        """Process user message and generate response with WireViz YAML if applicable"""
        try:
            # Build context-aware message
            user_context = user_message
            if current_yaml:
                user_context = f"""Current YAML configuration:
```yaml
{current_yaml}
```

User request: {user_message}

Please modify the existing YAML configuration based on the user's request. Only change what's specifically requested and preserve everything else."""
            
            if self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1500,
                    temperature=0.7,
                    system=self.system_prompt,
                    messages=[
                        {"role": "user", "content": user_context}
                    ]
                )
                content = response.content[0].text
            else:
                response = self.client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": user_context}
                    ],
                    temperature=0.7,
                    max_tokens=1500
                )
                content = response.choices[0].message.content
            
            # Extract YAML if present
            yaml_content = self._extract_yaml(content)
            
            # Remove YAML code blocks from the conversational response
            clean_content = self._remove_yaml_blocks(content)
            
            return LLMResponse(
                content=clean_content,
                yaml_generated=yaml_content,
                suggestions=self._generate_suggestions(user_message)
            )
            
        except Exception as e:
            return LLMResponse(
                content=f"Error processing message: {str(e)}",
                yaml_generated=None,
                suggestions=[]
            )
    
    def _extract_yaml(self, content: str) -> Optional[str]:
        """Extract YAML code blocks from LLM response"""
        import re
        
        # Look for YAML code blocks
        yaml_pattern = r'```(?:yaml|yml)?\n(.*?)```'
        matches = re.findall(yaml_pattern, content, re.DOTALL)
        
        if matches:
            return matches[0].strip()
        
        return None
    
    def _remove_yaml_blocks(self, content: str) -> str:
        """Remove YAML code blocks from conversational response"""
        import re
        
        # Remove YAML code blocks to keep only the conversational part
        yaml_pattern = r'```(?:yaml|yml)?.*?```'
        clean_content = re.sub(yaml_pattern, '', content, flags=re.DOTALL)
        
        # Clean up extra whitespace
        clean_content = re.sub(r'\n\s*\n', '\n\n', clean_content.strip())
        
        return clean_content
    
    def _generate_suggestions(self, user_message: str) -> list:
        """Generate helpful suggestions based on user input"""
        suggestions = []
        
        if "connector" in user_message.lower():
            suggestions.append("Consider specifying connector type (D-Sub, Molex, etc.)")
            suggestions.append("Add pin count and pin labels")
        
        if "cable" in user_message.lower():
            suggestions.append("Specify wire gauge (e.g., 22 AWG)")
            suggestions.append("Add cable length and wire count")
        
        if "connection" in user_message.lower():
            suggestions.append("Map specific pins between connectors")
            suggestions.append("Consider wire colors for clarity")
        
        return suggestions