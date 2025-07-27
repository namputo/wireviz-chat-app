import subprocess
import tempfile
import os
import asyncio
from pathlib import Path
import base64
from models.schemas import WireVizResponse, DiagramFormat

class WireVizService:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
    
    async def generate_diagram(self, yaml_content: str, format: DiagramFormat = DiagramFormat.SVG) -> WireVizResponse:
        """Generate diagram from WireViz YAML content"""
        try:
            # Create temporary YAML file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
                f.write(yaml_content)
                yaml_file = f.name
            
            # Run WireViz
            result = await self._run_wireviz(yaml_file)
            
            if not result["success"]:
                return WireVizResponse(
                    success=False,
                    error=result["error"],
                    format=format
                )
            
            # Read generated files
            base_name = Path(yaml_file).stem
            diagram_data = None
            bom_data = None
            
            # Read diagram file based on format
            if format == DiagramFormat.SVG:
                svg_file = f"{yaml_file.replace('.yml', '.svg')}"
                if os.path.exists(svg_file):
                    with open(svg_file, 'r') as f:
                        diagram_data = f.read()
            
            elif format == DiagramFormat.PNG:
                png_file = f"{yaml_file.replace('.yml', '.png')}"
                if os.path.exists(png_file):
                    with open(png_file, 'rb') as f:
                        diagram_data = base64.b64encode(f.read()).decode()
            
            elif format == DiagramFormat.HTML:
                html_file = f"{yaml_file.replace('.yml', '.html')}"
                if os.path.exists(html_file):
                    with open(html_file, 'r') as f:
                        diagram_data = f.read()
            
            # Read BOM file
            bom_file = f"{yaml_file.replace('.yml', '.bom.tsv')}"
            if os.path.exists(bom_file):
                with open(bom_file, 'r') as f:
                    bom_data = f.read()
            
            # Cleanup
            self._cleanup_files(yaml_file)
            
            return WireVizResponse(
                success=True,
                diagram_data=diagram_data,
                bom_data=bom_data,
                format=format
            )
            
        except Exception as e:
            return WireVizResponse(
                success=False,
                error=str(e),
                format=format
            )
    
    async def _run_wireviz(self, yaml_file: str) -> dict:
        """Run WireViz command line tool"""
        try:
            process = await asyncio.create_subprocess_exec(
                'wireviz', yaml_file,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return {"success": True, "output": stdout.decode()}
            else:
                return {"success": False, "error": stderr.decode()}
                
        except FileNotFoundError:
            return {"success": False, "error": "WireViz not found. Please install: pip install wireviz"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _cleanup_files(self, yaml_file: str):
        """Clean up generated files"""
        base_name = yaml_file.replace('.yml', '')
        extensions = ['.yml', '.svg', '.png', '.html', '.bom.tsv', '.gv']
        
        for ext in extensions:
            file_path = base_name + ext
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass