import React from 'react';
import { Handle } from 'reactflow';

const IfElseLogicNode = ({ data }) => {
  return (
    <div style={{ border: '1px solid #777', padding: 10, borderRadius: 5, background: '#fff' }}>
      <div>If-Else Logic Node</div>
      <Handle type="target" position="left" id="a" />
      <Handle type="source" position="right" id="b" />
    </div>
  );
};

export default IfElseLogicNode;
