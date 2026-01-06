from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

# In-memory storage for the current configuration
current_config = {
    "nodes": [],
    "edges": []
}
collab_message = ""

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
async def upload_config(request: Request):
    global current_config
    new_data = await request.json()

    # Ensure current_config is a dictionary before manipulating it
    if not isinstance(current_config, dict):
        current_config = current_config.model_dump()

    # ถ้ามีของเก่าอยู่ ให้เอา Node ใหม่ไปรวม (Merge) แทนการทับ
    if "nodes" in new_data:
        current_config["nodes"].extend(new_data["nodes"]) # เพิ่ม Node ต่อท้าย
    if "edges" in new_data:
        current_config["edges"].extend(new_data["edges"]) # เพิ่มเส้นเชื่อมต่อท้าย

    return {"message": "Nodes appended successfully"}

@app.post("/upload-collab") # แยก Endpoint ใหม่สำหรับ Colab
async def upload_collab(request: Request):
    global collab_message
    data = await request.json()
    # เก็บข้อมูลที่ส่งมาในรูปแบบ string เพื่อไปโชว์ใน textbox
    collab_message = json.dumps(data, indent=2)
    return {"status": "Collab message received"}

@app.get("/state")
async def get_state():
    # ส่งทั้ง config ของ Node และ message ของ Colab กลับไปพร้อมกัน
    return {
        "config": current_config,
        "collab_message": collab_message
    }

@app.get("/")
async def root():
    return {"message": "Backend is running"}
