
import React from 'react';

const ContextMenu = ({
  position,
  onClose,
  actions,
}) => {
  if (!position) return null;

  return (
    <div
      data-testid="context-menu"
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        padding: '5px 0',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {actions.map((action) => (
          <li
            key={action.label}
            onClick={action.effect}
            style={{
              padding: '8px 15px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          >
            {action.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
