import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],

  // 1. ส่วนจัดการ Nodes (ของเดิมที่คุณมี)
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  // 2. ส่วนจัดการ Edges (ของเดิม + สั่งรัน Flow ทันทีที่เชื่อมสาย)
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
    // [Added] เมื่อเชื่อมสายปุ๊บ ให้ข้อมูลไหลจากต้นทางไปปลายทางทันที
    get().runFlow(connection.source);
  },

  // 3. ฟังก์ชันเพิ่มโหนด (แบบที่คุณใช้ใน App.jsx)
  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  // 4. [New Heart] ฟังก์ชันอัปเดตข้อมูลและสั่งรัน Flow [cite: 2025-12-26]
  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          // ผสมข้อมูลใหม่เข้าไปใน data เดิม (Lego Modular Style)
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      }),
    });
    // ส่งค่าต่อไปยังโหนดลูกๆ ที่เชื่อมอยู่
    get().runFlow(nodeId);
  },

  // 5. [New Engine] ตัวคำนวณการไหลของข้อมูล (Recursive Data Propagation)
  runFlow: (sourceId) => {
    const { edges, nodes } = get();
    // หาเส้นไฟที่ออกจากโหนดต้นทางนี้
    const outcomingEdges = edges.filter((e) => e.source === sourceId);

    outcomingEdges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      // ถ้ามีทั้งต้นทางและปลายทาง และข้อมูลมีการเปลี่ยนแปลง
      if (sourceNode && targetNode) {
        // กฎพื้นฐาน: ส่งค่า .value จากต้นทางไปปลายทาง
        // คุณสามารถเพิ่ม Logic พิเศษตรงนี้ได้ในอนาคต (เช่น ถ้าเป็น Math Node ให้บวกเลข)
        const newValue = sourceNode.data.value;

        if (targetNode.data.value !== newValue) {
          // อัปเดตโหนดปลายทาง
          set({
            nodes: get().nodes.map((n) => {
              if (n.id === edge.target) {
                return { ...n, data: { ...n.data, value: newValue } };
              }
              return n;
            }),
          });
          // สั่งรัน Flow ต่อจากโหนดปลายทาง (เพื่อให้ข้อมูลไหลเป็นทอดๆ เหมือนโดมิโน่)
          get().runFlow(edge.target);
        }
      }
    });
  },

  // 6. ฟังก์ชันอื่นๆ ที่คุณอาจจะมี เช่น setNodes, setEdges (ใส่กลับมาให้ครบได้เลย)
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}));

export default useStore;
