const resolveNodeValue = (nodeId, nodes, edges, resolvedValues) => {
  if (resolvedValues.has(nodeId)) {
    return resolvedValues.get(nodeId);
  }

  const node = nodes.find(n => n.id === nodeId);
  if (!node) {
    return 'unresolved';
  }

  if (node.type === 'object') {
    let value;
    switch (node.data.dataType) {
      case 'number':
        value = parseFloat(node.data.value);
        break;
      case 'string':
        value = node.data.value;
        break;
      case 'boolean':
        value = node.data.value === 'true';
        break;
      default:
        value = node.data.value;
    }
    resolvedValues.set(nodeId, value);
    return value;
  }

  if (node.type === 'logic') {
    const inputAEdge = edges.find(e => e.target === nodeId && e.targetHandle === 'a');
    const inputBEdge = edges.find(e => e.target === nodeId && e.targetHandle === 'b');

    if (!inputAEdge || !inputBEdge) {
      return 'unresolved';
    }

    const valA = resolveNodeValue(inputAEdge.source, nodes, edges, resolvedValues);
    const valB = resolveNodeValue(inputBEdge.source, nodes, edges, resolvedValues);

    if (valA === 'unresolved' || valB === 'unresolved') {
      return 'unresolved';
    }

    let result;
    switch (node.data.operation) {
      case '+': result = valA + valB; break;
      case '-': result = valA - valB; break;
      case '*': result = valA * valB; break;
      case '/': result = valA / valB; break;
      case '>': result = valA > valB; break;
      case '<': result = valA < valB; break;
      case '==': result = valA == valB; break;
      default: result = 'unresolved';
    }
    resolvedValues.set(nodeId, result);
    return result;
  }

  return 'unresolved';
};

const resolvePrintNodeValues = (nodes, edges) => {
  const printNodes = nodes.filter(node => node.type === 'print');
  const resolvedValues = new Map();
  const updates = [];

  for (const printNode of printNodes) {
    const edge = edges.find(e => e.target === printNode.id);
    if (edge) {
      const value = resolveNodeValue(edge.source, nodes, edges, resolvedValues);
      updates.push({ nodeId: printNode.id, value });
    }
  }
  return updates;
};

export default resolvePrintNodeValues;
