import React from 'react';
import { Handle, Position } from 'reactflow';

const MathNode = ({ data }) => {
  return (
    <div className="react-flow__node-default" style={{ padding: '10px', width: 150 }}>
      <strong>Math Node</strong>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default MathNode;
