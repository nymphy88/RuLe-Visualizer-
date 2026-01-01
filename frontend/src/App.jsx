import React, { useState, useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import useStore from './store';
import ObjectNode from './components/nodes/ObjectNode';
import LogicNode from './components/nodes/LogicNode';
import PrintNode from './components/nodes/PrintNode';
import NodeActionPopup from './components/NodeActionPopup';
import generateCode from './utils/codeGenerator';
import resolvePrintNodeValues from './utils/valueResolver';
import 'reactflow/dist/style.css';
import './App.css';

const nodeTypes = {
  object: ObjectNode,
  logic: LogicNode,
  print: PrintNode,
};

const App = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useStore();
  const [popup, setPopup] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSynced, setIsSynced] = useState(true);

  useEffect(() => {
    const code = generateCode(nodes, edges);
    setGeneratedCode(code);
    setIsSynced(true);

    const updates = resolvePrintNodeValues(nodes, edges);
    for (const { nodeId, value } of updates) {
      useStore.getState().updateNodeData(nodeId, { value });
    }
  }, [nodes, edges]);

  const onAddNode = (type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {},
    };
    addNode(newNode);
    setIsSynced(false);
  };

  const onNodeClick = (event, node) => {
    event.stopPropagation();
    setPopup({
      node,
      position: { top: event.clientY, left: event.clientX },
    });
  };

  const closePopup = () => setPopup(null);

  const onSaveConfig = () => {
    const config = {
      nodes,
      edges,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "game_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const onSaveAndUpload = async () => {
    const config = {
      nodes,
      edges,
    };
    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error('Failed to upload config:', error);
      alert('Failed to upload config. See console for details.');
    }
  };

  return (
    <div className="app-container" onClick={closePopup}>
      <aside className="sidebar">
        <h2>Nodes</h2>
        <button onClick={() => onAddNode('object')}>Add Object Node</button>
        <button onClick={() => onAddNode('logic')}>Add Logic Node</button>
        <button onClick={() => onAddNode('print')}>Add Print Node</button>
        <hr />
        <button onClick={onSaveConfig}>Save Config</button>
        <button onClick={onSaveAndUpload}>Save & Upload</button>
      </aside>
      <main className="main-content">
        <div className="canvas-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              setIsSynced(false);
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              setIsSynced(false);
            }}
            onConnect={(connection) => {
              onConnect(connection);
              setIsSynced(false);
            }}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
          {popup && (
            <div style={{ position: 'absolute', ...popup.position }}>
              <NodeActionPopup node={popup.node} onClose={closePopup} />
            </div>
          )}
        </div>
        <aside className="code-preview-panel">
          <div className="code-preview-header">
            <h2>Code Preview</h2>
            <div className={`sync-status ${isSynced ? 'synced' : 'unsynced'}`}></div>
          </div>
          <pre>{generatedCode}</pre>
        </aside>
      </main>
    </div>
  );
};

export default App;
