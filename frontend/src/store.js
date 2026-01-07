import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import hasCycle from './utils/cycleDetection';
import { getLayoutedElements } from './utils/layout';

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  logs: ['Terminal initialized.'],

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
    const { nodes, edges } = get();

    if (hasCycle(nodes, edges, connection)) {
      console.warn('A cycle was detected. The connection is not allowed.');
      set({
        nodes: get().nodes.map(node => {
          if (node.id === connection.source || node.id === connection.target) {
            return { ...node, data: { ...node.data, status: 'Error: Loop' } };
          }
          return node;
        }),
      });
      return;
    }

    // Reset status for the connected nodes if they were in an error state
    set({
      nodes: get().nodes.map(node => {
        if ((node.id === connection.source || node.id === connection.target) && node.data.status === 'Error: Loop') {
          return { ...node, data: { ...node.data, status: 'Ready' } };
        }
        return node;
      }),
    });
  },

  updatePlayerNodeSpeed: (speed) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.type === 'player') {
          return { ...node, data: { ...node.data, speed: speed } };
        }
        return node;
      }),
    });
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

  addLog: (message) => {
    set((state) => ({ logs: [...state.logs, message] }));
  },

  alignSelectedNodes: (direction) => {
    const { nodes } = get();
    const selectedNodes = nodes.filter((node) => node.selected);

    if (selectedNodes.length < 2) return;

    let newNodes = [...nodes];
    switch (direction) {
      case 'left':
        const leftMostX = Math.min(...selectedNodes.map((n) => n.position.x));
        newNodes = nodes.map((n) =>
          n.selected ? { ...n, position: { ...n.position, x: leftMostX } } : n
        );
        break;
      case 'center':
        const centerX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
        newNodes = nodes.map((n) =>
          n.selected ? { ...n, position: { ...n.position, x: centerX } } : n
        );
        break;
      case 'top':
        const topMostY = Math.min(...selectedNodes.map((n) => n.position.y));
        newNodes = nodes.map((n) =>
          n.selected ? { ...n, position: { ...n.position, y: topMostY } } : n
        );
        break;
    }
    set({ nodes: newNodes });
  },

  autoLayoutNodes: () => {
    const { nodes, edges } = get();
    const layoutedNodes = getLayoutedElements(nodes, edges);
    set({ nodes: layoutedNodes });
  },

  groupSelectedNodes: () => {
    const { nodes } = get();
    const selectedNodes = nodes.filter((node) => node.selected);

    if (selectedNodes.length < 2) return;

    const minX = Math.min(...selectedNodes.map((n) => n.position.x));
    const minY = Math.min(...selectedNodes.map((n) => n.position.y));
    const maxX = Math.max(...selectedNodes.map((n) => n.position.x + (n.width || 150)));
    const maxY = Math.max(...selectedNodes.map((n) => n.position.y + (n.height || 50)));

    const groupNode = {
      id: `group-${Date.now()}`,
      type: 'group',
      position: { x: minX - 20, y: minY - 20 },
      data: { label: 'New Group' },
      style: {
        width: maxX - minX + 40,
        height: maxY - minY + 40,
      },
    };

    const newNodes = nodes.map((n) =>
      n.selected ? { ...n, parentNode: groupNode.id, selected: false } : n
    );

    set({ nodes: [...newNodes, groupNode] });
  },
}));

export default useStore;
