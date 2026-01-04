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
