import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    const { nodes } = get();
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);

    const sourceDataType = sourceNode.data.dataType || (['>', '<', '=='].includes(sourceNode.data.operation) ? 'boolean' : 'number');
    let targetDataType = 'any'; // Default for PrintNode

    if (targetNode.type === 'logic') {
      targetDataType = 'number';
    }

    if (targetDataType === 'any' || sourceDataType === targetDataType) {
      set({
        edges: addEdge(connection, get().edges),
      });
    } else {
      console.warn(`Incompatible connection: ${sourceDataType} to ${targetDataType}`);
    }
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });
  },

  cloneNode: (node) => {
    const newNode = {
      ...node,
      id: `${node.type}-${Date.now()}`,
      position: {
        x: node.position.x + 20,
        y: node.position.y + 20,
      },
      selected: false,
    };
    const newNodes = get().nodes.map(n => ({ ...n, selected: false }));
    set({ nodes: [...newNodes, newNode] });
  },

  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      }),
    });
  },
}));

export default useStore;
