import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import useStore from './store';
import ObjectNode from './components/nodes/ObjectNode.jsx';
import LogicNode from './components/nodes/LogicNode.jsx';
import PrintNode from './components/nodes/PrintNode.jsx';
import PlayerNode from './components/nodes/PlayerNode.jsx';
import MathNode from './components/nodes/MathNode.jsx';
import IfElseLogicNode from './components/nodes/IfElseLogicNode.jsx';
import 'reactflow/dist/style.css';
import './App.css';
import { getBackendUrl } from './utils/getBackendUrl.js';

const FRONTEND_VERSION = "v1.0.1-DataFlow";

const nodeTypes = {
  object: ObjectNode,
  logic: LogicNode,
  print: PrintNode,
  player: PlayerNode,
  math: MathNode,
  'logic-if-else': IfElseLogicNode
};

const App = () => {
  // ดึง State และ Actions มาจาก Store
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, updateNodeData } = useStore();
  
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [pollingRate, setPollingRate] = useState(1000);
  const [collabInputDisplay, setCollabInputDisplay] = useState('');
  const [backendVersion, setBackendVersion] = useState('');
  const timeoutId = useRef(null);
  const backendUrl = getBackendUrl();

  // --- [Backend Sync Logic] ---
  useEffect(() => {
    const fetchData = async () => {
      if (!isSyncEnabled) return;
      try {
        const response = await fetch(`${backendUrl}/state`);
        const data = await response.json();
        if (data.collab_message !== undefined) setCollabInputDisplay(data.collab_message);
        if (data.version) setBackendVersion(data.version);
      } catch (error) {
        console.error("Error fetching state:", error);
        setBackendVersion('Error');
      }
      timeoutId.current = setTimeout(fetchData, pollingRate);
    };

    if (isSyncEnabled) fetchData();
    return () => clearTimeout(timeoutId.current);
  }, [isSyncEnabled, pollingRate, backendUrl]);

  // --- [Handlers] ---
  const onAddNode = (type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 50, y: 50 },
      data: { value: 0, label: `${type} node`, onChange: updateNodeData }, // ใส่ onChange เข้าไปตรงๆ [cite: 2025-12-26]
    };
    addNode(newNode);
  };

  const onSave = async () => {
    try {
      const payload = { nodes, edges, collab_message: collabInputDisplay };
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

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-content">
          <h3>Nodes</h3>
          <div className="node-buttons">
            {['object', 'logic', 'logic-if-else', 'math', 'print', 'player'].map(type => (
              <button key={type} onClick={() => onAddNode(type)}>Add {type} Node</button>
            ))}
          </div>

          <h3>Settings</h3>
          <input type="range" min="200" max="5000" step="200" value={pollingRate} onChange={(e) => setPollingRate(Number(e.target.value))} />
          <button onClick={() => setIsSyncEnabled(p => !p)}>{isSyncEnabled ? 'Stop Sync' : 'Start Sync'}</button>
          <button onClick={onSave}>Save & Upload</button>
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
          fitView
        >
          <MiniMap />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>
      
      <div style={{ position: 'fixed', bottom: 5, right: 5, fontSize: '10px', opacity: 0.5 }}>
        F: {FRONTEND_VERSION} | B: {backendVersion || 'Connecting...'}
      </div>
    </div>
  );
};

export default App;
