// frontend/src/utils/cycleDetection.js

const hasCycle = (nodes, edges, newEdge) => {
  const allEdges = [...edges, newEdge];
  const graph = new Map();
  const visited = new Set();
  const recursionStack = new Set();

  allEdges.forEach(edge => {
    if (!graph.has(edge.source)) {
      graph.set(edge.source, []);
    }
    graph.get(edge.source).push(edge.target);
  });

  function detectCycle(node) {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (detectCycle(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (detectCycle(node.id)) {
        return true;
      }
    }
  }

  return false;
};

export default hasCycle;
