
import React from 'react';
import { Handle, Position } from 'reactflow';
import useStore from '../../store';
import { TypeColors } from '../../utils/types';

const IfElseLogicNode = ({ id, data }) => {
  const updateNodeData = useStore((state) => state.updateNodeData);

  const handleChange = (evt) => {
    updateNodeData(id, { operation: evt.target.value });
  };

  return (
    <div className="react-flow__node-default" style={{ padding: '10px', width: 200 }}>
      <strong>If-Else Logic Node</strong>
      <Handle type="target" position={Position.Left} id="a" style={{ top: '30px' }}>
        <span style={{ position: 'absolute', left: '-40px', top: '-8px' }}>A</span>
      </Handle>
      <Handle type="target" position={Position.Left} id="b" style={{ top: '60px' }}>
        <span style={{ position: 'absolute', left: '-40px', top: '-8px' }}>B</span>
      </Handle>
      <div style={{ marginTop: '10px' }}>
        <select value={data.operation || '>'} onChange={handleChange} style={{ width: '100%' }}>
          <option value=">">A &gt; B</option>
          <option value="<">A &lt; B</option>
          <option value="==">A == B</option>
        </select>
      </div>
      <Handle type="target" position={Position.Left} id="if_true" style={{ top: '90px' }}>
        <span style={{ position: 'absolute', left: '-60px', top: '-8px' }}>If True</span>
      </Handle>
      <Handle type="target" position={Position.Left} id="if_false" style={{ top: '120px' }}>
        <span style={{ position: 'absolute', left: '-65px', top: '-8px' }}>If False</span>
      </Handle>
      <Handle
        type="source"
        position={Position.Right}
        style={{ backgroundColor: TypeColors.number }}
      />
    </div>
  );
};

export default IfElseLogicNode;
