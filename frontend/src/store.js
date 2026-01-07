import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],

  // --- [CORE HANDLERS] ---
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    // ลากสายเชื่อมกันปุ๊บ...
    set({ edges: addEdge(connection, get().edges) });
    // ...ให้กระแสข้อมูลไหลทันทีจากต้นทาง
    get().runFlow(connection.source);
  },

  // --- [STATE SETTERS] ---
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  // ฟังก์ชันเพิ่มโหนดใหม่ (Lego Style)
  addNode: (node) => {
    // แทรกฟังก์ชัน onChange เข้าไปในโหนดทุกตัวเพื่อให้มันส่งข้อมูลกลับมาได้
    const newNode = {
      ...node,
      data: {
        ...node.data,
        onChange: get().updateNodeData, // ส่ง "รีโมท" คุม Store เข้าไปในโหนด
      },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  // --- [DATA FLOW ENGINE] หัวใจสำคัญ ---
  // ใช้สำหรับโหนดเรียกเพื่ออัปเดตค่าในตัวเอง [cite: 2025-12-26]
  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      }),
    });
    // พอกดเปลี่ยนค่าปุ๊บ ให้ไหลไปโหนดถัดไปทันที
    get().runFlow(nodeId);
  },

  // ฟังก์ชันคำนวณและส่งต่อข้อมูล (The Nerve System)
  runFlow: (sourceId) => {
    const { edges, nodes } = get();
    
    // 1. หาว่ามีสายไฟกี่เส้นที่ต่อ "ออกจาก" โหนดนี้
    const outcomingEdges = edges.filter((e) => e.source === sourceId);

    outcomingEdges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        // ดึงค่า value จากต้นทาง (เช่น MathNode)
        const newValue = sourceNode.data.value;

        // เช็คก่อนว่าค่าที่จะส่งไป "เปลี่ยนจริงไหม" เพื่อป้องกัน RAM ทำงานหนักเกินไป [cite: 2025-11-05]
        if (targetNode.data.value !== newValue) {
          // อัปเดตโหนดปลายทาง (เช่น PrintNode)
          set({
            nodes: get().nodes.map((n) => {
              if (n.id === edge.target) {
                return { ...n, data: { ...n.data, value: newValue } };
              }
              return n;
            }),
          });
          // สั่งให้โหนดปลายทาง "ไหลต่อ" ไปยังโหนดถัดไป (ถ้ามี)
          get().runFlow(edge.target);
        }
      }
    });
  },
}));

export default useStore;
