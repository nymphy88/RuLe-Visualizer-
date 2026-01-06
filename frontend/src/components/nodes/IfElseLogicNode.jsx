import React from 'react';
import { Handle, Position } from 'reactflow';

const IfElseLogicNode = ({ data }) => {
  return (
    <div className="react-flow__node-default" style={{ padding: '10px', width: 150 }}>
      <strong>If-Else Logic Node</strong>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default IfElseLogicNode;
