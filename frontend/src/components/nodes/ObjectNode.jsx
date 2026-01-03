import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import useStore from '../../store'; // นำเข้าแบบ Default Import
import { DataTypes, TypeColors } from '../../utils/types';

const ObjectNode = ({ id, data }) => {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const setEditing = useStore((state) => state.setEditing);

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
          <input 
            type="text" 
            name="name" 
            value={data.name || ''} // เปลี่ยนเป็น value เพื่อให้ UI อัปเดตตาม State
            onChange={handleChange} 
            onFocus={() => setEditing(true)}
            onBlur={() => setEditing(false)}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ marginTop: '5px', display: 'block' }}>
          Value:
          <input 
            type="text" 
            name="value" 
            value={data.value || ''} 
            onChange={handleChange} 
            className="object-node-input"
            onFocus={() => setEditing(true)}
            onBlur={() => setEditing(false)}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ marginTop: '5px', display: 'block' }}>
          Type:
          <select 
            name="dataType" 
            value={data.dataType || DataTypes.NUMBER} 
            onChange={handleChange}
            style={{ width: '100%' }}
          >
            <option value={DataTypes.NUMBER}>Number</option>
            <option value={DataTypes.STRING}>String</option>
            <option value={DataTypes.BOOLEAN}>Boolean</option>
          </select>
        </label>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        // ✅ ระบบสีจะเปลี่ยนตาม Data Type ที่เลือก
        style={{ backgroundColor: TypeColors[data.dataType || DataTypes.NUMBER] }}
      />
    </div>
  );
};

export default ObjectNode;