from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware #

app = FastAPI()

# ✅ จุดที่ 1: เพิ่ม Middleware เพื่อแก้ปัญหา 405 (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # อนุญาตให้ทุกที่ส่งข้อมูลมาหาได้ (เหมาะสำหรับการทดสอบ)
    allow_credentials=True,
    allow_methods=["*"], # อนุญาตทุก Method (GET, POST, OPTIONS ฯลฯ)
    allow_headers=["*"], # อนุญาตทุก Header
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
    current_config = config
    print(config.model_dump_json(indent=2))
    return {"message": "Configuration received successfully"}

@app.get("/state")
async def get_state():
    return current_config

@app.get("/")
async def root():
    return {"message": "Backend is running"}
