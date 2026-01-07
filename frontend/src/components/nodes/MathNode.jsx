import React from 'react';
import { Handle, Position } from 'reactflow';

const MathNode = ({ id, data }) => {
  const handleChange = (evt) => {
    const val = parseFloat(evt.target.value) || 0;
    // สำคัญ: เรียกใช้ onChange ที่ส่งมาจาก App.js เพื่ออัปเดตค่าที่ศูนย์กลาง [cite: 2025-12-26]
    if (data.onChange) {
      data.onChange(id, val);
    }
  };

  return (
    <div style={{ padding: '10px', background: '#fff', border: '1px solid #777', borderRadius: '5px', width: 150 }}>
      <strong>🔢 Math Node</strong>
      <input 
        type="number" 
        defaultValue={data.value} 
        onChange={handleChange} 
        style={{ width: '100%', marginTop: '5px' }}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default MathNode;
