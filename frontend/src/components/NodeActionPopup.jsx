import React from 'react';
import useStore from '../store';
import './NodeActionPopup.css';

const NodeActionPopup = ({ node, onClose }) => {
  const { deleteNode, cloneNode } = useStore();

  const handleDelete = () => {
    deleteNode(node.id);
    onClose();
  };

  const handleClone = () => {
    cloneNode(node);
    onClose();
  };

  return (
    <div className="node-action-popup">
      <button onClick={handleDelete}>Delete</button>
      <button onClick={handleClone}>Clone</button>
      <button disabled>Toggle Active</button>
      <button disabled>Scale</button>
    </div>
  );
};

export default NodeActionPopup;
