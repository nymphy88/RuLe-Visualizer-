import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import useStore from '../../store';
import { DataTypes, TypeColors } from '../../utils/types';

const ObjectNode = ({ id, data }) => {
  const { updateNodeData } from useStore();

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
        <label style={{ marginTop: '5px', display: 'block' }}>
          Type:
          <select name="dataType" value={data.dataType || DataTypes.NUMBER} onChange={handleChange}>
            <option value={DataTypes.NUMBER}>Number</option>
            <option value={DataTypes.STRING}>String</option>
            <option value={DataTypes.BOOLEAN}>Boolean</option>
          </select>
        </label>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ backgroundColor: TypeColors[data.dataType || DataTypes.NUMBER] }}
      />
    </div>
  );
};

export default ObjectNode;
