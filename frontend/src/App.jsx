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
// เพิ่ม Imports (สมมติว่าไฟล์มีอยู่แล้ว)
import PlayerNode from './components/nodes/PlayerNode';
import MathNode from './components/nodes/MathNode';
import IfElseLogicNode from './components/nodes/IfElseLogicNode';

// แก้ nodeTypes
const nodeTypes = {
  object: ObjectNode,
  logic: LogicNode,
  print: PrintNode,
  player: PlayerNode,      // เพิ่ม
  math: MathNode,          // เพิ่ม
  'logic-if-else': IfElseLogicNode, // เพิ่ม
};

const App = () => {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const addNode = useStore((state) => state.addNode);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const [popup, setPopup] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSynced, setIsSynced] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCodePreviewCollapsed, setIsCodePreviewCollapsed] = useState(false);

  // New state for Colab synchronization
  const [collabInputDisplay, setCollabInputDisplay] = useState('');
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);

  // Polling logic with recursive setTimeout
  useEffect(() => {
    let timeoutId;

    const pollState = async () => {
      if (!isSyncEnabled) {
        return;
      }
      try {
        const response = await fetch('http://localhost:8000/state');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const serverState = await response.json();

        // Update display every time, as requested
        setCollabInputDisplay(JSON.stringify(serverState, null, 2));

        const localNodes = useStore.getState().nodes;
        // Simple comparison to check for differences
        if (JSON.stringify(localNodes) !== JSON.stringify(serverState.nodes)) {
          useStore.setState({ nodes: serverState.nodes });
        }
      } catch (error) {
        console.error("Polling error:", error);
      } finally {
        // Schedule the next poll
        timeoutId = setTimeout(pollState, 1000);
      }
    };

    // Start polling
    pollState();

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isSyncEnabled]); // Re-run effect when isSyncEnabled changes

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
          <button onClick={() => onAddNode('player')}>Add Player Node</button>
          <button onClick={() => onAddNode('math')}>Add Math Node</button>
          <button onClick={() => onAddNode('logic-if-else')}>Add If-Else Node</button>
          <hr />
          <button onClick={onSaveConfig}>Save Config</button>
          <button onClick={onSaveAndUpload}>Save & Upload</button>
          <input type="file" accept=".json" onChange={onLoadConfig} style={{ display: 'none' }} id="load-config-input" />
          <button onClick={() => document.getElementById('load-config-input').click()}>Load Config</button>
          <button onClick={onExportToPy}>Export to .py</button>
          <hr />
          <h2>Colab Sync</h2>
          <button onClick={() => setIsSyncEnabled(!isSyncEnabled)}>
            {isSyncEnabled ? 'Disable Sync' : 'Enable Sync'}
          </button>
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
            <div className="code-preview-header">
              <h2>Colab Input Display</h2>
            </div>
            <pre>{collabInputDisplay}</pre>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
