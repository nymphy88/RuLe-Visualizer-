import React from 'react';
import { Handle, Position } from 'reactflow';

const PrintNode = ({ data }) => {
  const status = data.status || 'Ready';
  const statusColor = status === 'Error: Loop' ? 'red' : (status === 'Running...' ? 'orange' : 'green');

  return (
    <div className="react-flow__node-default" style={{ padding: '10px', width: 200, border: `1px solid ${status === 'Error: Loop' ? 'red' : '#ddd'}` }}>
      <strong>Print Node</strong>
      <div style={{ marginTop: '10px', fontSize: '12px' }}>
        Status: <span style={{ color: statusColor, fontWeight: 'bold' }}>{status}</span>
      </div>
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
