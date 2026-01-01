const generateCode = (nodes, edges) => {
  let code = '';
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  const findSourceNodeData = (targetNodeId, targetHandleId) => {
    const edge = edges.find(e => e.target === targetNodeId && e.targetHandle === targetHandleId);
    if (!edge) return null;
    const sourceNode = nodeMap.get(edge.source);
    if (!sourceNode) return null;

    if (sourceNode.type === 'object') {
      return sourceNode.data.name || 'unnamed_variable';
    }
    // For logic nodes, we might need to recursively generate their output variable name
    return `output_of_${sourceNode.id.replace(/-/g, '_')}`;
  };

  for (const node of nodes) {
    switch (node.type) {
      case 'object':
        code += `# Object Node: ${node.data.name || 'unnamed'}\n`;
        code += `${node.data.name || 'unnamed_variable'} = ${node.data.value || 'None'}\n\n`;
        break;
      case 'logic':
        {
          const inputA = findSourceNodeData(node.id, 'a') || 'input_a';
          const inputB = findSourceNodeData(node.id, 'b') || 'input_b';
          const outputVar = `output_of_${node.id.replace(/-/g, '_')}`;
          code += `# Logic Node: ${node.id}\n`;
          code += `${outputVar} = ${inputA} ${node.data.operation || '+'} ${inputB}\n\n`;
        }
        break;
      case 'print':
        {
          const inputValue = findSourceNodeData(node.id, null) || 'None';
          code += `# Print Node: ${node.id}\n`;
          code += `print(${inputValue})\n\n`;
        }
        break;
      default:
        break;
    }
  }

  return code;
};

export default generateCode;
