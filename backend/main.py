from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
# 1. เพิ่มตัว Import นี้เข้ามา
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 2. เพิ่มการตั้งค่า CORS (พนักงานต้อนรับ)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # อนุญาตทุกแหล่งที่มา (แบบลูกทุ่งๆ ให้รันผ่านก่อน)
    allow_credentials=True,
    allow_methods=["*"], # อนุญาตทุกวิธี (GET, POST, OPTIONS)
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
    print("--- Received Config ---")
    # เปลี่ยนจาก config.json(indent=2) เป็น model_dump_json
    print(config.model_dump_json(indent=2)) 
    return {"message": "Configuration received successfully"}

@app.get("/")
async def root():
    return {"message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)