import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const FRONTEND_VERSION = "v1.1.0-Clean-DataFlow";

const nodeTypes = {
  object: ObjectNode,
  logic: LogicNode,
  print: PrintNode,
  player: PlayerNode,
  math: MathNode,
  'logic-if-else': IfElseLogicNode
};

const App = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, updateNodeData } = useStore();
  
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [pollingRate, setPollingRate] = useState(1000);
  const [collabInputDisplay, setCollabInputDisplay] = useState('');
  const [backendVersion, setBackendVersion] = useState('');
  const timeoutId = useRef(null);
  const backendUrl = getBackendUrl();

  // --- [Sync Logic] ดึงข้อมูลจาก Backend ---
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

  // --- [Event Handlers] ---
  const onAddNode = useCallback((type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { 
        label: `${type} node`, 
        value: type === 'math' ? 0 : '', // กำหนดค่าเริ่มต้นตามประเภทโหนด
        onChange: updateNodeData // ส่งฟังก์ชันอัปเดตเข้าไปในโหนด [cite: 2025-12-26]
      },
    };
    addNode(newNode);
  }, [addNode, updateNodeData]);

  const onSave = async () => {
    try {
      const payload = { nodes, edges, collab_message: collabInputDisplay };
      const response = await fetch(`${backendUrl}/update_state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      alert(`Saved: ${result.status}`);
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
            {Object.keys(nodeTypes).map(type => (
              <button key={type} onClick={() => onAddNode(type)}>+ {type.toUpperCase()}</button>
            ))}
          </div>

          <h3>System</h3>
          <div className="settings-group">
            <label>Polling: {pollingRate}ms</label>
            <input type="range" min="200" max="5000" step="200" value={pollingRate} onChange={(e) => setPollingRate(Number(e.target.value))} />
            <button className={isSyncEnabled ? 'active' : ''} onClick={() => setIsSyncEnabled(!isSyncEnabled)}>
              {isSyncEnabled ? 'Stop Sync' : 'Start Sync'}
            </button>
            <button onClick={onSave}>Save to Cloud</button>
          </div>
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
          <Background color="#f0f0f0" gap={20} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <div className="status-bar">
        F: {FRONTEND_VERSION} | B: {backendVersion || 'Disconnected'}
      </div>
    </div>
  );
};

export default App;
