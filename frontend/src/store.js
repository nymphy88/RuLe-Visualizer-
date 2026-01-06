import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import hasCycle from './utils/cycleDetection';

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  logs: ['Terminal initialized.'],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    const isRemoveChange = changes.some(change => change.type === 'remove');

    set(state => {
      let newNodes = state.nodes;
      // If an edge is removed, it might break a cycle. Reset status of error nodes.
      if (isRemoveChange) {
        newNodes = state.nodes.map(node => {
          if (node.data.status === 'Error: Loop') {
            return { ...node, data: { ...node.data, status: 'Ready' } };
          }
          return node;
        });
      }

      return {
        edges: applyEdgeChanges(changes, state.edges),
        nodes: newNodes,
      };
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

  addLog: (message) => {
    set((state) => ({ logs: [...state.logs, message] }));
  },
}));

export default useStore;
