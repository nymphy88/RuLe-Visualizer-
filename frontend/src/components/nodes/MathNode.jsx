
import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import useStore from '../../store';
import { TypeColors } from '../../utils/types';

const MathNode = ({ id, data }) => {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const [variables, setVariables] = useState([]);

  useEffect(() => {
    // Parse the expression to find variables whenever it changes
    const foundVariables = data.expression ? data.expression.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [] : [];
    const uniqueVariables = [...new Set(foundVariables)];
    setVariables(uniqueVariables);
  }, [data.expression]);

  const handleChange = (evt) => {
    updateNodeData(id, { expression: evt.target.value });
  };

  return (
    <div className="react-flow__node-default" style={{ padding: '10px', width: 200 }}>
      <strong>Math Expression Node</strong>
      <div style={{ marginTop: '10px' }}>
        <label>
          Expression:
          <input
            type="text"
            name="expression"
            value={data.expression || ''}
            onChange={handleChange}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      {variables.map((variable, index) => (
        <Handle
          key={index} // Use index for a stable key during re-renders
          type="target"
          position={Position.Left}
          id={`var-${index}`} // Use a stable, index-based ID
          style={{ top: `${(index + 1) * 30 + 50}px`, background: '#555' }}
        >
          <span style={{ position: 'absolute', left: '-40px', top: '-8px', fontSize: '10px' }}>{variable}</span>
        </Handle>
      ))}
      <Handle
        type="source"
        position={Position.Right}
        style={{ backgroundColor: TypeColors.number }}
      />
    </div>
  );
};

export default MathNode;
