import React from 'react';
import { Handle, Position } from 'reactflow';

const MathNode = ({ id, data }) => {
  const handleChange = (evt) => {
    const val = parseFloat(evt.target.value) || 0;
    
    // [แก้ไขจุดนี้]: ส่งเป็น Object { value: val } เพื่อให้ Store เอาไปรวม (merge) ได้ถูกต้อง
    if (data.onChange) {
      data.onChange(id, { value: val }); 
    }
  };

  return (
    <div style={{ padding: '10px', background: '#fff', border: '1px solid #777', borderRadius: '5px', width: 150 }}>
      <strong>🔢 Math Node</strong>
      <input 
        type="number" 
        // ใช้ value แทน defaultValue เพื่อให้โหนดอัปเดตตาม Store ได้เสมอ (Controlled Component)
        value={data.value || 0} 
        onChange={handleChange} 
        style={{ width: '100%', marginTop: '5px' }}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default MathNode;
