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

  const getBackendUrl = () => {
    let backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    if (backendUrl && !backendUrl.startsWith('http')) {
      const protocol = window.location.protocol;
      backendUrl = `${protocol}//${backendUrl}`;
    }
    return backendUrl;
  };
  const [isSynced, setIsSynced] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCodePreviewCollapsed, setIsCodePreviewCollapsed] = useState(false);

  useEffect(() => {
    try {
      const code = generateCode(nodes, edges);
      setGeneratedCode(code);
      setIsSynced(true);

      const updates = resolvePrintNodeValues(nodes, edges);
      const { nodes: currentNodes, updateNodeData } = useStore.getState();
      const nodeMap = new Map(currentNodes.map(node => [node.id, node]));

      for (const { nodeId, value } of updates) {
        const currentNode = nodeMap.get(nodeId);
        if (currentNode && currentNode.data.value !== value) {
          updateNodeData(nodeId, { value });
        }
      }
    } catch (error) {
      console.error("Error in effect:", error);
      // Optionally, display an error message to the user
    }
  }, [nodes, edges]);

  useEffect(() => {
    const checkBackendConnection = async () => {
      const backendUrl = getBackendUrl();
      console.log("Fetching from:", backendUrl);
      try {
        const response = await fetch(`${backendUrl}/health`);
        if (response.ok) {
          console.log('Backend Connected');
        } else {
          console.error('Backend connection failed:', response.statusText);
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
      }
    };

    checkBackendConnection();
  }, []);

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
      const backendUrl = getBackendUrl();
      console.log("Fetching from:", backendUrl);
      const response = await fetch(`${backendUrl}/upload`, {
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

  const onLoadConfig = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const config = JSON.parse(e.target.result);
        useStore.setState({ nodes: config.nodes, edges: config.edges });
      };
      reader.readAsText(file);
    }
  };

  const onExportToPy = () => {
    const dataStr = "data:text/python;charset=utf-8," + encodeURIComponent(generatedCode);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "generated_code.py");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="app-container" onClick={closePopup}>
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="collapse-btn">
          {isSidebarCollapsed ? '>' : '<'}
        </button>
        <div className="sidebar-content">
          <h2>Nodes</h2>
          <button onClick={() => onAddNode('object')}>Add Object Node</button>
          <button onClick={() => onAddNode('logic')}>Add Logic Node</button>
          <button onClick={() => onAddNode('print')}>Add Print Node</button>
          <hr />
          <button onClick={onSaveConfig}>Save Config</button>
          <button onClick={onSaveAndUpload}>Save & Upload</button>
          <input type="file" accept=".json" onChange={onLoadConfig} style={{ display: 'none' }} id="load-config-input" />
          <button onClick={() => document.getElementById('load-config-input').click()}>Load Config</button>
          <button onClick={onExportToPy}>Export to .py</button>
        </div>
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
        <aside className={`code-preview-panel ${isCodePreviewCollapsed ? 'collapsed' : ''}`}>
          <button onClick={() => setIsCodePreviewCollapsed(!isCodePreviewCollapsed)} className="collapse-btn">
            {isCodePreviewCollapsed ? '<' : '>'}
          </button>
          <div className="code-preview-content">
            <div className="code-preview-header">
              <h2>Code Preview</h2>
              <div className={`sync-status ${isSynced ? 'synced' : 'unsynced'}`}></div>
            </div>
            <pre>{generatedCode}</pre>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
