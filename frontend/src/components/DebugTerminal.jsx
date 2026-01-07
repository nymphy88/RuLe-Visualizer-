import React, { useState } from 'react';
import useStore from '../store';
import './DebugTerminal.css';

// --- TERMINAL CONFIG ---
const TERMINAL_SETTINGS = {
  initialHeight: "200px",
  defaultExpanded: false,
  commands: ["setSpeed", "debugState", "clearLog"],
  colors: { bg: "#1e1e1e", text: "#00ff00" }
};

const DebugTerminal = () => {
  const [isExpanded, setIsExpanded] = useState(TERMINAL_SETTINGS.defaultExpanded);
  const logs = useStore((state) => state.logs);
  const addLog = useStore((state) => state.addLog);
  const [input, setInput] = useState('');

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const [command, ...args] = input.trim().split(' ');
      addLog(`> ${input}`);

      switch (command) {
        case 'setSpeed':
          const speed = parseFloat(args[0]);
          if (!isNaN(speed)) {
            useStore.getState().updatePlayerNodeSpeed(speed);
            addLog(`Player speed set to ${speed}.`);
          } else {
            addLog(`Error: Invalid speed value.`);
          }
          break;
        case 'debugState':
          const { nodes, edges } = useStore.getState();
          addLog('Current State:');
          addLog(`- Nodes: ${nodes.length}`);
          addLog(`- Edges: ${edges.length}`);
          break;
        case 'clearLog':
          useStore.setState({ logs: ['Terminal initialized.'] });
          break;
        default:
          addLog(`Unknown command: ${command}`);
      }
      setInput('');
    }
  };

  return (
    <div className="debug-terminal-container" style={{ height: isExpanded ? TERMINAL_SETTINGS.initialHeight : '40px', backgroundColor: TERMINAL_SETTINGS.colors.bg }}>
      <div className="terminal-header" onClick={handleToggle}>
        <span>Debug Terminal</span>
        <span>{isExpanded ? '▼' : '▲'}</span>
      </div>
      {isExpanded && (
        <div className="terminal-body">
          <div className="terminal-logs" style={{ color: TERMINAL_SETTINGS.colors.text }}>
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleCommand}
            className="terminal-input"
            placeholder="Type command..."
            style={{ backgroundColor: '#333', color: TERMINAL_SETTINGS.colors.text }}
          />
        </div>
      )}
    </div>
  );
};

export default DebugTerminal;
