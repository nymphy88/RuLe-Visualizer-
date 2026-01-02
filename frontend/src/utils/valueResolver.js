// A simple and safe evaluation function
const safeEval = (expression, context) => {
  try {
    // A regex to validate the expression and prevent access to global scope
    if (!/^[a-zA-Z0-9\s_+\-*/().,]+$/.test(expression)) {
      return 'invalid expression';
    }
    const func = new Function(...Object.keys(context), `return ${expression}`);
    return func(...Object.values(context));
  } catch (error) {
    return 'error';
  }
};

const resolveNodeValue = (nodeId, nodes, edges, resolvedValues) => {
  if (resolvedValues.has(nodeId)) {
    return resolvedValues.get(nodeId);
  }

  const node = nodes.find(n => n.id === nodeId);
  if (!node || !node.data) { // Added check for node.data
    return 'unresolved';
  }

  try {
    if (node.type === 'object') {
      let value;
      switch (node.data.dataType) {
        case 'number':
          value = parseFloat(node.data.value || 0);
          break;
        case 'string':
          value = String(node.data.value || '');
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

    const LOGIC_CONFIG = {
      '+': (a, b) => a + b,
      '-': (a, b) => a - b,
      '*': (a, b) => a * b,
      '/': (a, b) => a / b,
      '>': (a, b) => a > b,
      '<': (a, b) => a < b,
      '==': (a, b) => a == b,
    };

    const operationFn = LOGIC_CONFIG[node.data.operation];
    const result = operationFn ? operationFn(valA, valB) : 'unresolved';

    resolvedValues.set(nodeId, result);
    return result;
    }

    if (node.type === 'math') {
      const expression = node.data.expression || '';
      const variables = [...new Set(expression.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [])];
      const context = {};
      let allResolved = true;

      for (const variable of variables) {
        const edge = edges.find(e => e.target === nodeId && e.targetHandle === variable);
        if (edge) {
          const value = resolveNodeValue(edge.source, nodes, edges, resolvedValues);
          if (value === 'unresolved' || value === 'error') {
            allResolved = false;
            break;
          }
          context[variable] = value;
        } else {
          allResolved = false;
          break;
        }
      }

      if (allResolved) {
        const result = safeEval(expression, context);
        resolvedValues.set(nodeId, result);
        return result;
      }
    }

    if (node.type === 'logic-if-else') {
      const inputAEdge = edges.find(e => e.target === nodeId && e.targetHandle === 'a');
      const inputBEdge = edges.find(e => e.target === nodeId && e.targetHandle === 'b');
      const ifTrueEdge = edges.find(e => e.target === nodeId && e.targetHandle === 'if_true');
      const ifFalseEdge = edges.find(e => e.target === nodeId && e.targetHandle === 'if_false');

      if (inputAEdge && inputBEdge && ifTrueEdge && ifFalseEdge) {
        const valA = resolveNodeValue(inputAEdge.source, nodes, edges, resolvedValues);
        const valB = resolveNodeValue(inputBEdge.source, nodes, edges, resolvedValues);
        const valTrue = resolveNodeValue(ifTrueEdge.source, nodes, edges, resolvedValues);
        const valFalse = resolveNodeValue(ifFalseEdge.source, nodes, edges, resolvedValues);

        if (valA !== 'unresolved' && valB !== 'unresolved') {
          const operation = node.data.operation;
          let conditionMet = false;
          if (operation === '>' && valA > valB) conditionMet = true;
          else if (operation === '<' && valA < valB) conditionMet = true;
          else if (operation === '==' && valA == valB) conditionMet = true;

          const result = conditionMet ? valTrue : valFalse;
          resolvedValues.set(nodeId, result);
          return result;
        }
      }
    }
  } catch (error) {
    console.error(`Error resolving node ${nodeId}:`, error);
    return 'error';
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
