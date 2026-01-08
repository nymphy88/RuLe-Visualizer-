import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import useStore from './store';
import ObjectNode from './components/nodes/ObjectNode.jsx';
import LogicNode from './components/nodes/LogicNode.jsx';
import PrintNode from './components/nodes/PrintNode.jsx';
import PlayerNode from './components/nodes/PlayerNode.jsx';
import MathNode from './components/nodes/MathNode.jsx';
import IfElseLogicNode from './components/nodes/IfElseLogicNode.jsx';
import GroupNode from './components/nodes/GroupNode.jsx';
import DebugTerminal from './components/DebugTerminal.jsx';
import 'reactflow/dist/style.css';
import './App.css';
import { getBackendUrl } from './utils/getBackendUrl.js';

// --- CONFIG SECTION ---
const FRONTEND_VERSION = "v1.0.1-UI-Update";
// ----------------------

const nodeTypes = {
  object: ObjectNode,
  logic: LogicNode,
  print: PrintNode,
  player: PlayerNode,
  math: MathNode,
  'logic-if-else': IfElseLogicNode,
  group: GroupNode,
};

const App = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, addLog, alignSelectedNodes, autoLayoutNodes, groupSelectedNodes } = useStore();
  
  // --- [Config Variables] ---
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [pollingRate, setPollingRate] = useState(1000);
  const [collabInputDisplay, setCollabInputDisplay] = useState('');
  const [backendVersion, setBackendVersion] = useState('');
  const timeoutId = useRef(null);
  const backendUrl = getBackendUrl();

  // --- [Core Logic] Refactored Polling ---
  useEffect(() => {
    const fetchData = async () => {
      if (!isSyncEnabled) return;
      try {
        const response = await fetch(`${backendUrl}/state`);
        const data = await response.json();

        // if (data.config) {
        //   // This logic is now disabled to prevent overwriting local state.
        //   // useStore.setState({ nodes: data.config.nodes || [], edges: data.config.edges || [] });
        // }

        if (data.collab_message !== undefined && data.collab_message !== collabInputDisplay) {
          setCollabInputDisplay(data.collab_message);
          addLog(`New collab message: ${data.collab_message}`);
        }

        if (data.version) {
          setBackendVersion(data.version);
        }

      } catch (error) {
        console.error("Error fetching state:", error);
        setBackendVersion('Error');
      }
      timeoutId.current = setTimeout(fetchData, pollingRate);
    };

    if (isSyncEnabled) {
      fetchData();
    } else {
      setBackendVersion(''); // Clear backend version when not syncing
    }
    return () => clearTimeout(timeoutId.current);
  }, [isSyncEnabled, pollingRate, backendUrl]);

  // --- [Helper Functions] ---
  const onAddNode = (type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `${type} node` },
    };
    addNode(newNode);
  };

  const onSave = async () => {
    try {
      const payload = {
        nodes: nodes,
        edges: edges,
        collab_message: collabInputDisplay // Assuming we send the current display text
      };
      const response = await fetch(`${backendUrl}/update_state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      alert(`Status: ${result.status}`);
    } catch (error) {
      alert(`Save failed: ${error.message}`);
    }
  };

  const onNodeContextMenu = (event, node) => {
    event.preventDefault();
    console.log('Context menu on node:', node);
  };

  const onPaneContextMenu = (event) => {
    event.preventDefault();
    console.log('Context menu on pane');
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-content">
          <h3>Nodes</h3>
          <div className="node-buttons">
            <button onClick={() => onAddNode('object')}>Add Object Node</button>
            <button onClick={() => onAddNode('logic')}>Add Logic Node</button>
            <button onClick={() => onAddNode('logic-if-else')}>Add If-Else Node</button>
            <button onClick={() => onAddNode('math')}>Add Math Node</button>
            <button onClick={() => onAddNode('print')}>Add Print Node</button>
            <button onClick={() => onAddNode('player')}>Add Player Node</button>
          </div>

          <h3>Settings</h3>
          <div>
            <label>Polling Rate: {pollingRate / 1000}s</label>
            <input 
              type="range" min="200" max="5000" step="200"
              value={pollingRate} 
              onChange={(e) => setPollingRate(Number(e.target.value))}
            />
          </div>
          <button onClick={() => setIsSyncEnabled(prev => !prev)}>
            {isSyncEnabled ? 'Stop Sync' : 'Start Sync'}
          </button>
          <button onClick={onSave}>Save & Upload</button>

          <h3>Layout Tools</h3>
          <div className="layout-buttons">
            <button onClick={() => alignSelectedNodes('left')}>Align Left</button>
            <button onClick={() => alignSelectedNodes('center')}>Align Center</button>
            <button onClick={() => alignSelectedNodes('top')}>Align Top</button>
            <button onClick={autoLayoutNodes}>Auto-Layout</button>
            <button onClick={groupSelectedNodes}>Group Selection</button>
          </div>

          <h3>Collaboration</h3>
          <textarea className="collaboration-input" value={collabInputDisplay} readOnly rows="10" placeholder="Collaborator input will appear here..."/>
        </div>
      </div>
      <div className="main-content">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <div className="code-preview-panel">
        <div className="code-preview-content">
          <div className="code-preview-header">
            <h2>Code Preview</h2>
            <div className={`sync-status ${isSyncEnabled ? 'synced' : 'unsynced'}`}></div>
          </div>
          <pre>
            {/* Placeholder for code preview */}
            # Print Node: print-1767436451252\nprint("")\n\n# Object Node: unnamed\nunnamed_variable = None
          </pre>
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 5, right: 5, fontSize: '10px', opacity: 0.5 }}>
        F: {FRONTEND_VERSION} | B: {backendVersion || 'Connecting...'}
      </div>
      <DebugTerminal />
    </div>
  );
};

export default App;
