from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 1. Define Standard Model as requested
class ConfigModel(BaseModel):
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    collab_message: Optional[str] = ""

# Unified global state with initial default nodes
global_state = {
    "config": {
        "nodes": [
            {"id": "object-1", "type": "object", "position": {"x": 100, "y": 100}, "data": {"name": "Var", "value": "10"}},
            {"id": "logic-1", "type": "logic", "position": {"x": 300, "y": 100}, "data": {"operation": "+"}},
            {"id": "print-1", "type": "print", "position": {"x": 500, "y": 100}, "data": {}},
            {"id": "player-1", "type": "player", "position": {"x": 100, "y": 300}, "data": {}},
            {"id": "math-1", "type": "math", "position": {"x": 300, "y": 300}, "data": {"expression": "x + y"}},
            {"id": "logic-if-else-1", "type": "logic-if-else", "position": {"x": 500, "y": 300}, "data": {}}
        ],
        "edges": []
    },
    "collab_message": ""
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Endpoints for Render Health Check
@app.get("/")
def read_root():
    return {"status": "Live"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# 3. Standard Post Endpoint
@app.post("/upload")
async def upload_config(data: ConfigModel):
    global global_state
    global_state["config"] = {"nodes": data.nodes, "edges": data.edges}
    # Note: The user's new frontend logic sends the collab message as part of the main upload.
    # We will handle it here. If the user wants to send it separately, another endpoint would be needed.
    # Based on the new model, it seems everything comes in one payload.
    if data.collab_message is not None:
        global_state["collab_message"] = data.collab_message
    return {"status": "success", "received_message": data.collab_message}

@app.get("/state")
async def get_state():
    return {
        "config": global_state.get("config", {"nodes": [], "edges": []}),
        "collab_message": global_state.get("collab_message", "")
    }
