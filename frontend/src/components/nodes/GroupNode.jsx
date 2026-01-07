import React from 'react';
import { Handle, Position } from 'reactflow';

const GroupNode = ({ data, style }) => {
  return (
    <div
      style={{
        backgroundColor: 'rgba(0, 128, 0, 0.1)',
        border: '1px solid #2ecc71',
        borderRadius: '5px',
        padding: '20px',
        ...style,
      }}
    >
      <strong>{data.label || 'Group'}</strong>
    </div>
  );
};

export default GroupNode;
