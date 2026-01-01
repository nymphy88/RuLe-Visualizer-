import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import useStore from '../../store';
import { DataTypes, TypeColors } from '../../utils/types';

const LogicNode = ({ id, data }) => {
  const { updateNodeData } = useStore();

  const handleChange = useCallback((evt) => {
    updateNodeData(id, { operation: evt.target.value });
  }, [id, updateNodeData]);

  const getOutputDataType = (operation) => {
    if (['>', '<', '=='].includes(operation)) {
      return DataTypes.BOOLEAN;
    }
    return DataTypes.NUMBER;
  };

  const outputDataType = getOutputDataType(data.operation || '+');

  return (
    <div className="react-flow__node-default" style={{ padding: '10px', width: 150 }}>
      <strong>Logic Node</strong>
      <div style={{ marginTop: '10px' }}>
        <select value={data.operation || '+'} onChange={handleChange}>
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">*</option>
          <option value="/">/</option>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value="==">==</option>
        </select>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        style={{ top: '30%', backgroundColor: TypeColors[DataTypes.NUMBER] }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="b"
        style={{ top: '70%', backgroundColor: TypeColors[DataTypes.NUMBER] }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ backgroundColor: TypeColors[outputDataType] }}
      />
    </div>
  );
};

export default LogicNode;
