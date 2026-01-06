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

const nodeTypes = {
  object: ObjectNode,
  logic: LogicNode,
  print: PrintNode,
  player: PlayerNode,
  math: MathNode,
  'logic-if-else': IfElseLogicNode
};

const App = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useStore();
  
  // --- [Config Variables] ประกาศค่าแบบ Modular ตามที่ต้องการ ---
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [pollingRate, setPollingRate] = useState(1000); // Slider Control
  const [collabInputDisplay, setCollabInputDisplay] = useState('');
  const timeoutId = useRef(null);
  const backendUrl = getBackendUrl();

  // --- [Core Logic] รวมร่าง Polling ให้เหลืออันเดียวที่ฉลาดที่สุด ---
  useEffect(() => {
    const poll = async () => {
      if (!isSyncEnabled) return;

      // ตรวจสอบสถานะการแก้ไขเพื่อไม่ให้ AI เขียนทับ (Low Waste)
      const isEditing = useStore.getState().isEditing;
      if (!isEditing) {
        try {
          const response = await fetch(`${backendUrl}/state`);
          if (response.ok) {
            const serverState = await response.json();
            setCollabInputDisplay(JSON.stringify(serverState, null, 2));

            const { nodes: localNodes, edges: localEdges } = useStore.getState();
            // อัปเดตเฉพาะเมื่อมีความเปลี่ยนแปลง (Quantum-like efficiency)
            if (JSON.stringify(serverState.nodes) !== JSON.stringify(localNodes) ||
                JSON.stringify(serverState.edges) !== JSON.stringify(localEdges)) {
              useStore.setState({ nodes: serverState.nodes, edges: serverState.edges });
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }
      // ใช้ตัวแปร pollingRate เพื่อให้ Slider ควบคุมความเร็วได้
      timeoutId.current = setTimeout(poll, pollingRate);
    };

    if (isSyncEnabled) poll();
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
      const response = await fetch(`${backendUrl}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      alert(`Save failed: ${error.message}`);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-content">
          <h2 className="sidebar-title">Configuration</h2>
          <div className="button-group">
             <button onClick={onSave}>Save & Upload</button>
             <button onClick={() => setIsSyncEnabled(prev => !prev)}>
               {isSyncEnabled ? 'Stop Sync' : 'Start Sync'}
             </button>
          </div>

          {/* Slider สำหรับคุมความเร็ว (คืนชีพฟีเจอร์ที่หายไป) */}
          <div style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Polling Speed: {pollingRate}ms</label>
            <input 
              type="range" min="200" max="5000" step="200"
              value={pollingRate} 
              onChange={(e) => setPollingRate(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="node-buttons" style={{ marginTop: '20px' }}>
            <button onClick={() => onAddNode('object')}>+ Object</button>
            <button onClick={() => onAddNode('logic')}>+ Logic</button>
            <button onClick={() => onAddNode('print')}>+ Print</button>
            <button onClick={() => onAddNode('player')}>+ Player</button>
            <button onClick={() => onAddNode('math')}>+ Math</button>
            <button onClick={() => onAddNode('logic-if-else')}>+ If-Else</button>
          </div>

          <textarea className="collaboration-input" value={collabInputDisplay} readOnly rows="10" />
        </div>
      </div>
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default App;