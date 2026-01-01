from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI()

class Node(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]

class Edge(BaseModel):
    id: str
    source: str
    target: str

class Config(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

@app.post("/upload")
async def upload_config(config: Config):
    # For now, just print the received config
    print(config.json(indent=2))
    return {"message": "Configuration received successfully"}

@app.get("/")
async def root():
    return {"message": "Backend is running"}
