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

@app.post("/upload")
async def upload_config(config: Config):
    # ✅ จุดที่ 2: แก้ไขให้เป็น Pydantic V2 Syntax เพื่อความนิ่งของระบบ
    print(config.model_dump_json(indent=2)) 
    return {"message": "Configuration received successfully"}

@app.get("/")
async def root():
    return {"message": "Backend is running"}
