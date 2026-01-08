import React, { useCallback } from 'react';
import useStore from '../store';

const ContextMenu = ({ id, top, left, right, bottom, ...props }) => {
  const { deleteNode, disconnectNode } = useStore();

  const handleDisconnect = useCallback(() => {
    disconnectNode(id);
  }, [disconnectNode, id]);

  const handleDelete = useCallback(() => {
    deleteNode(id);
  }, [deleteNode, id]);

  const style = {
    top,
    left,
    right,
    bottom,
    position: 'absolute',
    zIndex: 10,
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  };

  if (top === null) {
    style.top = 'auto';
  } else {
    style.bottom = 'auto';
  }

  if (left === null) {
    style.left = 'auto';
  } else {
    style.right = 'auto';
  }

  return (
    <div style={style} {...props}>
      {id && (
        <>
          <button onClick={handleDisconnect}>Disconnect</button>
          <button onClick={handleDelete}>Delete</button>
        </>
      )}
    </div>
  );
};

export default ContextMenu;
