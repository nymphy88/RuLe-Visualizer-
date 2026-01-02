from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware #

app = FastAPI()

# ✅ จุดที่ 1: เพิ่ม Middleware เพื่อแก้ปัญหา 405 (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://frontend-xbuu.onrender.com"
    ],
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

@app.get("/health")
async def health():
    return {"status": "ok"}

GAME_RULES = {
    "rules": [
        {
            "condition": {
                "node_type": "logic",
                "property": "output",
                "value": True
            },
            "action": {
                "node_type": "player",
                "property": "speed",
                "value": 5
            }
        }
    ]
}

def resolve_node_value(node_id: str, nodes: List[Node], edges: List[Edge], resolved_values: Dict[str, Any]):
    if node_id in resolved_values:
        return resolved_values[node_id]

    node = next((n for n in nodes if n.id == node_id), None)
    if not node:
        return 'unresolved'

    value = 'unresolved'
    if node.type == 'object':
        data_type = node.data.get('dataType', 'string')
        raw_value = node.data.get('value')
        if data_type == 'number':
            value = float(raw_value or 0)
        elif data_type == 'boolean':
            value = str(raw_value).lower() == 'true'
        else:
            value = str(raw_value or '')
    elif node.type == 'logic':
        input_a_edge = next((e for e in edges if e.target == node_id and e.targetHandle == 'a'), None)
        input_b_edge = next((e for e in edges if e.target == node_id and e.targetHandle == 'b'), None)

        if input_a_edge and input_b_edge:
            val_a = resolve_node_value(input_a_edge.source, nodes, edges, resolved_values)
            val_b = resolve_node_value(input_b_edge.source, nodes, edges, resolved_values)

            if val_a != 'unresolved' and val_b != 'unresolved':
                operation = node.data.get('operation')
                ops = {
                    '+': lambda a, b: a + b,
                    '-': lambda a, b: a - b,
                    '*': lambda a, b: a * b,
                    '/': lambda a, b: a / b if b != 0 else 0,
                    '>': lambda a, b: a > b,
                    '<': lambda a, b: a < b,
                    '==': lambda a, b: a == b,
                }
                if operation in ops:
                    value = ops[operation](val_a, val_b)

    resolved_values[node_id] = value
    return value

@app.post("/simulate")
async def simulate(config: Config):
    resolved_values = {}
    updates = []

    # Resolve all node values first
    for node in config.nodes:
        resolve_node_value(node.id, config.nodes, config.edges, resolved_values)

    # Apply game rules
    for rule in GAME_RULES["rules"]:
        condition = rule["condition"]
        action = rule["action"]

        for node in config.nodes:
            if node.type == condition["node_type"]:
                output = resolved_values.get(node.id)
                if output == condition["value"]:
                    # Condition met, find target node to apply action
                    for target_node in config.nodes:
                        if target_node.type == action["node_type"]:
                            updates.append({
                                "nodeId": target_node.id,
                                "data": {
                                    action["property"]: action["value"]
                                }
                            })

    # Process updates for player nodes
    for node in config.nodes:
        if node.type == 'player':
            current_speed = node.data.get('speed', 0)

            # Check for updates from game rules
            for update in updates:
                if update.get("nodeId") == node.id and "speed" in update.get("data", {}):
                    current_speed = update["data"]["speed"]

            # If speed is applied, calculate new position
            if current_speed > 0:
                new_x = node.position['x'] + current_speed
                new_y = node.position['y']

                # Check if there's already a position update for this node
                pos_update_found = False
                for update in updates:
                    if update.get("nodeId") == node.id and "position" in update:
                        update["position"]["x"] = new_x
                        update["position"]["y"] = new_y
                        pos_update_found = True
                        break

                if not pos_update_found:
                    updates.append({
                        "nodeId": node.id,
                        "position": {"x": new_x, "y": new_y}
                    })

    return {"updates": updates}
