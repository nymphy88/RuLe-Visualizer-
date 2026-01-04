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
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [collabInputDisplay, setCollabInputDisplay] = useState('');
  const timeoutId = useRef(null);

  useEffect(() => {
    const poll = async () => {
      if (!isSyncEnabled) return;

      const isEditing = useStore.getState().isEditing;
      if (!isEditing) {
        const backendUrl = getBackendUrl();
        try {
          const response = await fetch(`${backendUrl}/state`);
          if (!response.ok) {
            if (response.status >= 500) {
              console.error('Failed to fetch state from backend: Server error.');
            }
            const errorData = await response.json().catch(() => ({ detail: "An unknown error occurred." }));
            throw new Error(errorData.detail || 'Failed to fetch state');
          }
          const serverState = await response.json();
          setCollabInputDisplay(JSON.stringify(serverState, null, 2));
          const { nodes: localNodes, edges: localEdges } = useStore.getState();
          if (JSON.stringify(serverState.nodes) !== JSON.stringify(localNodes) ||
              JSON.stringify(serverState.edges) !== JSON.stringify(localEdges)) {
            useStore.setState({ nodes: serverState.nodes, edges: serverState.edges });
          }
        } catch (error) {
          console.error('Failed to fetch state from backend:', error);
        }
      }
      timeoutId.current = setTimeout(poll, 2000);
    };

    if (isSyncEnabled) {
      poll();
    }

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [isSyncEnabled]);

  const onAddNode = (type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {},
    };
    addNode(newNode);
  };

  const onSave = async () => {
    const config = {
      nodes,
      edges,
    };
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        if (response.status >= 500) {
          console.error('Failed to save to backend: Server error');
        }
        const errorData = await response.json().catch(() => ({ detail: "An unknown error occurred." }));
        throw new Error(errorData.detail || 'Failed to save');
      }
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error('Failed to save config:', error);
      alert(`Failed to save config: ${error.message}`);
    }
  };

  const onRestore = async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/state`);
      if (!response.ok) {
        if (response.status >= 500) {
          console.error('Failed to restore from backend: Server error');
        }
        const errorData = await response.json().catch(() => ({ detail: "An unknown error occurred." }));
        throw new Error(errorData.detail || 'Failed to restore');
      }
      const serverState = await response.json();
      useStore.setState({ nodes: serverState.nodes, edges: serverState.edges });
    } catch (error) {
      console.error('Failed to restore config:', error);
      alert(`Failed to restore config: ${error.message}`);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-content">
          <h2 className="sidebar-title">Configuration</h2>
          <button onClick={onSave}>Save & Upload</button>
          <button onClick={onRestore}>Restore</button>
          <button onClick={() => onAddNode('object')}>Add Object Node</button>
          <button onClick={() => onAddNode('logic')}>Add Logic Node</button>
          <button onClick={() => onAddNode('print')}>Add Print Node</button>
          <button onClick={() => onAddNode('player')}>Add Player Node</button>
          <button onClick={() => onAddNode('math')}>Add Math Node</button>
          <button onClick={() => onAddNode('logic-if-else')}>Add If-Else Logic Node</button>
          <button onClick={() => setIsSyncEnabled(prev => !prev)}>
            {isSyncEnabled ? 'Stop Sync' : 'Start Sync'}
          </button>
          <textarea
            className="collaboration-input"
            value={collabInputDisplay}
            readOnly
            rows="10"
          />
        </div>
      </div>
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
        <Background />
      </ReactFlow>
    </div>
  );
};

export default App;
