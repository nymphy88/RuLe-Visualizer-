import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import useStore from './store';
import ObjectNode from './components/nodes/ObjectNode';
import LogicNode from './components/nodes/LogicNode';
import PrintNode from './components/nodes/PrintNode';
import PlayerNode from './components/nodes/PlayerNode';
import MathNode from './components/nodes/MathNode';
import IfElseLogicNode from './components/nodes/IfElseLogicNode';
import NodeActionPopup from './components/NodeActionPopup';
import generateCode from './utils/codeGenerator';
import 'reactflow/dist/style.css';
import './App.css';

const nodeTypes = {
  object: ObjectNode,
  logic: LogicNode,
  print: PrintNode,
  player: PlayerNode,
  math: MathNode,
  'logic-if-else': IfElseLogicNode,
};

const getBackendUrl = () => {
  let backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  if (backendUrl && !backendUrl.startsWith('http')) {
    const protocol = window.location.protocol;
    backendUrl = `${protocol}//${backendUrl}`;
  }
  return backendUrl;
};

const App = () => {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const addNode = useStore((state) => state.addNode);
  const [popup, setPopup] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSynced, setIsSynced] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCodePreviewCollapsed, setIsCodePreviewCollapsed] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Auto-save with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const config = {
        nodes,
        edges,
      };

      const backendUrl = getBackendUrl();
      fetch(`${backendUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Auto-save failed');
        }
      })
      .catch((error) => {
        console.error('Failed to auto-save config:', error);
      });
    }, 250); // Debounce delay

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [nodes, edges]);

  useEffect(() => {
    try {
      const code = generateCode(nodes, edges);
      setGeneratedCode(code);
      setIsSynced(true);
    } catch (error) {
      console.error("Error in code generation:", error);
    }
  }, [nodes, edges]);

  useEffect(() => {
    const resolveAndUpdatePrintNodes = async () => {
      const { nodes, edges, updateNodeData } = useStore.getState();
      const config = { nodes, edges };
      const backendUrl = getBackendUrl();

      try {
        const response = await fetch(`${backendUrl}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        const resolvedValues = await response.json();

        nodes.forEach(node => {
          if (node.type === 'print' && resolvedValues[node.id] !== undefined && node.data.value !== resolvedValues[node.id]) {
            updateNodeData(node.id, { value: resolvedValues[node.id] });
          }
        });
      } catch (error) {
        console.error('Failed to resolve print nodes:', error);
      }
    };

    resolveAndUpdatePrintNodes();
  }, [nodes, edges]);

  useEffect(() => {
    const checkBackendConnection = async () => {
      const backendUrl = getBackendUrl();
      try {
        const response = await fetch(`${backendUrl}/health`);
        if (!response.ok) {
          console.error('Backend connection failed:', response.statusText);
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
      }
    };

    checkBackendConnection();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const { isEditing } = useStore.getState();
      if (!isEditing) {
        const backendUrl = getBackendUrl();
        fetch(`${backendUrl}/state`)
          .then(response => response.json())
          .then(serverState => {
            const { nodes: localNodes, edges: localEdges } = useStore.getState();
            if (JSON.stringify(serverState.nodes) !== JSON.stringify(localNodes) ||
                JSON.stringify(serverState.edges) !== JSON.stringify(localEdges)) {
              useStore.setState({ nodes: serverState.nodes, edges: serverState.edges });
            }
          })
          .catch(error => {
            console.error('Failed to fetch state from backend:', error);
          });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isSimulationMode) {
      return;
    }

    const intervalId = setInterval(async () => {
      const { nodes, edges, updateNodeData, updateNodePosition } = useStore.getState();
      const config = { nodes, edges };
      const backendUrl = getBackendUrl();

      try {
        const response = await fetch(`${backendUrl}/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        const { updates } = await response.json();

        updates.forEach(update => {
          if (update.data) {
            updateNodeData(update.nodeId, update.data);
          }
          if (update.position) {
            updateNodePosition(update.nodeId, update.position);
          }
        });
      } catch (error) {
        console.error('Simulation step failed:', error);
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [isSimulationMode, getBackendUrl]);

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
          <button onClick={() => onAddNode('logic-if-else')}>Add If-Else Node</button>
          <button onClick={() => onAddNode('math')}>Add Math Node</button>
          <button onClick={() => onAddNode('print')}>Add Print Node</button>
          <button onClick={() => onAddNode('player')}>Add Player Node</button>
          <hr />
          <button onClick={() => setIsSimulationMode(!isSimulationMode)}>
            {isSimulationMode ? 'Stop Simulation' : 'Start Simulation'}
          </button>
          <button onClick={onSaveConfig}>Save Config</button>
          <button onClick={onSaveAndUpload}>Save & Upload</button>
          <input type="file" accept=".json" onChange={onLoadConfig} style={{ display: 'none' }} id="load-config-input" />
          <button onClick={() => document.getElementById('load-config-input').click()}>Load Config</button>
          <button onClick={onExportToPy}>Export to .py</button>
          <hr />
          <h2>Collaboration</h2>
          <textarea
            name="collaborationInput"
            readOnly
            placeholder="Collaborator input will appear here..."
            style={{ width: '100%', height: '100px', marginTop: '10px' }}
          />
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
