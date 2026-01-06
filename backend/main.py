from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# In-memory storage for the current configuration
current_config = {
    "nodes": [],
    "edges": []
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"], # Explicitly allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Node(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]

class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class Config(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

# Default 6 nodes for initial state
default_nodes = [
    {"id": "object-1", "type": "object", "position": {"x": 100, "y": 100}, "data": {"name": "Var", "value": "10"}},
    {"id": "logic-1", "type": "logic", "position": {"x": 300, "y": 100}, "data": {"operation": "+"}},
    {"id": "print-1", "type": "print", "position": {"x": 500, "y": 100}, "data": {}},
    {"id": "player-1", "type": "player", "position": {"x": 100, "y": 300}, "data": {}},
    {"id": "math-1", "type": "math", "position": {"x": 300, "y": 300}, "data": {"expression": "x + y"}},
    {"id": "logic-if-else-1", "type": "logic-if-else", "position": {"x": 500, "y": 300}, "data": {}}
]
current_config = Config(nodes=default_nodes, edges=[])

@app.post("/upload")
async def upload_config(config: Config):
    global current_config
    current_config = config.model_dump()
    print("Configuration updated:")
    print(config.model_dump_json(indent=2))
    return {"message": "Configuration received successfully"}

@app.get("/state")
async def get_state():
    return current_config

@app.get("/")
async def root():
    return {"message": "Backend is running"}
