import React from 'react';
import { Handle, Position } from 'reactflow';

const PrintNode = ({ data }) => {
  return (
    <div className="react-flow__node-default" style={{ padding: '10px', width: 200 }}>
      <strong>Print Node</strong>
      <div style={{ marginTop: '10px' }}>
        <textarea
          rows="4"
          value={data.value || ''}
          readOnly
          style={{ width: '100%', resize: 'none' }}
        />
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

export default PrintNode;
