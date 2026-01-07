import React from 'react';
import { Handle, Position } from 'reactflow';

const PrintNode = ({ data }) => {
  return (
    <div style={{ padding: '10px', background: '#f0f0f0', border: '1px solid #333', borderRadius: '5px', width: 200 }}>
      <strong>🖨️ Print Node</strong>
      <div style={{ marginTop: '10px' }}>
        <textarea
          rows="4"
          value={data.value || ''}
          readOnly
          style={{ width: '100%', resize: 'none', backgroundColor: '#fff' }}
        />
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

export default PrintNode;
