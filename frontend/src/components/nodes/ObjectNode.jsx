import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import useStore from '../../store';

const ObjectNode = ({ id, data }) => {
  const { updateNodeData } = useStore();

  const handleChange = useCallback((evt) => {
    const { name, value } = evt.target;
    updateNodeData(id, { [name]: value });
  }, [id, updateNodeData]);

  return (
    <div className="react-flow__node-default" style={{ padding: '10px', width: 150 }}>
      <strong>Object Node</strong>
      <div style={{ marginTop: '10px' }}>
        <label>
          Name:
          <input type="text" name="name" defaultValue={data.name} onChange={handleChange} />
        </label>
        <label style={{ marginTop: '5px', display: 'block' }}>
          Value:
          <input type="text" name="value" defaultValue={data.value} onChange={handleChange} />
        </label>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default ObjectNode;
