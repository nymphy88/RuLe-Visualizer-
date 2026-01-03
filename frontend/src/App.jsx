import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import useStore from './store';
import ObjectNode from './components/nodes/ObjectNode';
import LogicNode from './components/nodes/LogicNode';
import PrintNode from './components/nodes/PrintNode';
import PlayerNode from './components/nodes/PlayerNode';
import MathNode from './components/nodes/MathNode';
import IfElseLogicNode from './components/nodes/IfElseLogicNode';
import ContextMenu from './components/ContextMenu';
import ErrorBoundary from './components/ErrorBoundary';
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

const migrateSchema = (config) => {
  if (!config) {
    return { nodes: [], edges: [] };
  }

  const migratedNodes = config.nodes.map(node => {
    const data = node.data || {};

    // Ensure all nodes have a data object.
    const newNode = { ...node, data: { ...data } };

    switch (newNode.type) {
      case 'object':
        newNode.data.dataType = newNode.data.dataType || 'string';
        newNode.data.value = newNode.data.value || '';
        break;
      case 'logic':
        newNode.data.operation = newNode.data.operation || '==';
        break;
      case 'math':
        newNode.data.expression = newNode.data.expression || '';
        break;
      case 'logic-if-else':
        newNode.data.operation = newNode.data.operation || '==';
        break;
      case 'player':
        newNode.data.speed = newNode.data.speed || 0;
        break;
      case 'print':
        newNode.data.value = newNode.data.value || '';
        newNode.data.status = newNode.data.status || 'Ready';
        break;
      default:
        break;
    }
    return newNode;
  });

  const migratedEdges = (config.edges || []).map(edge => ({
    ...edge,
    sourceHandle: edge.sourceHandle || null,
    targetHandle: edge.targetHandle || null,
  }));

  return { nodes: migratedNodes, edges: migratedEdges };
};

const App = () => {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const addNode = useStore((state) => state.addNode);
  const setEditing = useStore((state) => state.setEditing);
  const pollingRate = useStore((state) => state.pollingRate);
  const setPollingRate = useStore((state) => state.setPollingRate);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const deleteNode = useStore((state) => state.deleteNode);
  const cloneNode = useStore((state) => state.cloneNode);
  const disconnectNodeEdges = useStore((state) => state.disconnectNodeEdges);
  const deleteEdgeById = useStore((state) => state.deleteEdgeById);
  const [contextMenu, setContextMenu] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSynced, setIsSynced] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCodePreviewCollapsed, setIsCodePreviewCollapsed] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [collabInputDisplay, setCollabInputDisplay] = useState('');

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
      .then(async response => {
        if (!response.ok) {
          if (response.status >= 500) {
             console.error('Auto-save failed: Server error.');
          }
          const errorData = await response.json().catch(() => ({ detail: "An unknown error occurred." }));
          throw new Error(errorData.detail || 'Auto-save failed');
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
      if (nodes.length === 0) return;
      const config = { nodes, edges };
      const backendUrl = getBackendUrl();

      try {
        const response = await fetch(`${backendUrl}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        if (!response.ok) {
          if (response.status >= 500) {
            console.error('Failed to resolve print nodes: Server error.');
          }
          const errorData = await response.json().catch(() => ({ detail: "An unknown error occurred." }));
          throw new Error(errorData.detail || 'Failed to resolve print nodes');
        }
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
  }, [nodes, edges, updateNodeData]);

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
      const isEditing = useStore.getState().isEditing;
      if (!isEditing) {
        const backendUrl = getBackendUrl();
        fetch(`${backendUrl}/state`)
          .then(async response => {
            if (!response.ok) {
                if (response.status >= 500) {
                    console.error('Failed to fetch state from backend: Server error.');
                }
                const errorData = await response.json().catch(() => ({ detail: "An unknown error occurred." }));
                throw new Error(errorData.detail || 'Failed to fetch state');
            }
            return response.json()
          })
          .then(serverState => {
            setCollabInputDisplay(JSON.stringify(serverState, null, 2));
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
    }, pollingRate);

    return () => clearInterval(interval);
  }, [pollingRate]);

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
  }, [isSimulationMode, nodes, edges]);

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

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      const pane = event.target.closest('.react-flow__pane');
      const rect = pane.getBoundingClientRect();
      setContextMenu({
        node,
        position: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
      });
    },
    [setContextMenu]
  );

  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      deleteEdgeById(edge.id);
    },
    [deleteEdgeById]
  );

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      setContextMenu(null);
    },
    [setContextMenu]
  );

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

      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error("A server-side error occurred. Please try again later.");
        }
        const errorData = await response.json().catch(() => ({ detail: "An unknown error occurred." }));
        throw new Error(errorData.detail);
      }

      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error('Failed to upload config:', error);
      alert(`Failed to upload config: ${error.message}`);
    }
  };

  const onLoadConfig = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result);
          const migratedConfig = migrateSchema(config);
          useStore.setState({ nodes: migratedConfig.nodes, edges: migratedConfig.edges });
        } catch (error) {
          console.error("Failed to load or parse config file:", error);
          alert("Error: Could not load or parse the configuration file. It might be corrupted or in an old format.");
        }
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

  const contextMenuActions = contextMenu?.node
    ? [
        { label: 'Delete', effect: () => deleteNode(contextMenu.node.id) },
        { label: 'Clone', effect: () => cloneNode(contextMenu.node) },
        { label: 'Disconnect All Edges', effect: () => disconnectNodeEdges(contextMenu.node.id) },
      ]
    : [];

  return (
    <div className="app-container" onClick={() => setContextMenu(null)}>
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
          <h2>Settings</h2>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <label htmlFor="pollingRate" style={{ marginRight: '10px' }}>Polling Rate:</label>
            <input
              type="range"
              id="pollingRate"
              name="pollingRate"
              min="1000"
              max="20000"
              value={pollingRate}
              onChange={(e) => setPollingRate(Number(e.target.value))}
              style={{ flexGrow: 1 }}
            />
            <span style={{ marginLeft: '10px', minWidth: '40px' }}>{(pollingRate / 1000).toFixed(1)}s</span>
          </div>
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
          <ErrorBoundary>
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
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            onNodeDragStart={() => setEditing(true)}
            onNodeDragStop={() => setEditing(false)}
            nodeTypes={nodeTypes}
            fitView={false}
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
          </ErrorBoundary>
          {contextMenu && (
            <ContextMenu
              position={contextMenu.position}
              actions={contextMenuActions}
              onClose={() => setContextMenu(null)}
            />
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
