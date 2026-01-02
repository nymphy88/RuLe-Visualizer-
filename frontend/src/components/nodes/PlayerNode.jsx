
import React from 'react';
import { Handle } from 'reactflow';

const PlayerNode = ({ data, xPos, yPos }) => {
  return (
    <div style={{ border: '1px solid #777', padding: 10, borderRadius: 5, background: '#f3f3f3' }}>
      <Handle type="target" position="left" id="speed" style={{ top: '50%' }} />
      <div>
        <strong>Player Node</strong>
      </div>
      <div style={{ marginTop: 10 }}>
        <div>X: {Math.round(xPos)}</div>
        <div>Y: {Math.round(yPos)}</div>
        <div>Speed: {data.speed || 0}</div>
      </div>
    </div>
  );
};

export default PlayerNode;
