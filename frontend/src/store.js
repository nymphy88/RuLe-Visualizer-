import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  isEditing: false,
  pollingRate: 5000,

  setPollingRate: (pollingRate) => set({ pollingRate }),
  setEditing: (isEditing) => set({ isEditing }),

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
    const { nodes, edges } = get();
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);

    // Type compatibility check
    const sourceDataType = sourceNode.data.dataType || (['>', '<', '=='].includes(sourceNode.data.operation) ? 'boolean' : 'number');
    let targetDataType = 'any'; // Default for PrintNode
    if (targetNode.type === 'logic') {
      targetDataType = 'number';
    }

    if (targetDataType !== 'any' && sourceDataType !== targetDataType) {
      console.warn(`Incompatible connection: ${sourceDataType} to ${targetDataType}`);
      return; // Prevent connection
    }

    // Enforce 1-to-1 connection for inputs
    const newEdges = edges.filter(edge => !(edge.target === connection.target && edge.targetHandle === connection.targetHandle));

    set({
      edges: addEdge({ ...connection, animated: true }, newEdges),
    });
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  deleteNode: (nodeId) => {
    const { edges, nodes } = get();
    const updatedEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);

    // Find nodes that were targets of the deleted node and need their inputs reset
    const targetNodesToUpdate = edges
        .filter(edge => edge.source === nodeId)
        .map(edge => ({
            nodeId: edge.target,
            dataToReset: { [edge.targetHandle]: null } // e.g., { inputA: null }
        }));

    let updatedNodes = nodes.filter((node) => node.id !== nodeId);

    targetNodesToUpdate.forEach(update => {
        updatedNodes = updatedNodes.map(node => {
            if (node.id === update.nodeId) {
                return { ...node, data: { ...node.data, ...update.dataToReset } };
            }
            return node;
        });
    });

    set({
        nodes: updatedNodes,
        edges: updatedEdges,
    });
  },

  disconnectNodeEdges: (nodeId) => {
    const { edges, nodes } = get();
    const updatedEdges = edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);

    const targetNodesToUpdate = edges
        .filter(edge => edge.source === nodeId || edge.target === nodeId)
        .map(edge => ({
            nodeId: edge.target,
            dataToReset: { [edge.targetHandle]: null }
        }));

    let updatedNodes = [...nodes];
    targetNodesToUpdate.forEach(update => {
        updatedNodes = updatedNodes.map(node => {
            if (node.id === update.nodeId && update.dataToReset) {
                return { ...node, data: { ...node.data, ...update.dataToReset } };
            }
            return node;
        });
    });

    set({
        nodes: updatedNodes,
        edges: updatedEdges,
    });
  },

  deleteEdgeById: (edgeId) => {
    const { edges, nodes } = get();
    const edgeToRemove = edges.find(edge => edge.id === edgeId);
    if (!edgeToRemove) return;

    const updatedEdges = edges.filter(edge => edge.id !== edgeId);
    const { target, targetHandle } = edgeToRemove;

    // Reset the input on the target node
    const updatedNodes = nodes.map(node => {
        if (node.id === target && targetHandle && node.data[targetHandle] !== undefined) {
            return { ...node, data: { ...node.data, [targetHandle]: null } };
        }
        return node;
    });

    set({
        nodes: updatedNodes,
        edges: updatedEdges,
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

  updateNodePosition: (nodeId, newPosition) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, position: { ...node.position, ...newPosition } };
        }
        return node;
      }),
    });
  },
}));

export default useStore;
