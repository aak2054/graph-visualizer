import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [nodes, setNodes] = useState([
    { id: 0, x: 100, y: 250 },
    { id: 1, x: 300, y: 100 },
    { id: 2, x: 300, y: 400 },
    { id: 3, x: 500, y: 400 },
    { id: 4, x: 500, y: 100 },
  ]);
  
  const [edges, setEdges] = useState([
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 8 },
    { from: 1, to: 2, weight: 3 },
    { from: 1, to: 4, weight: 6 },
    { from: 2, to: 3, weight: 2 },
    { from: 4, to: 3, weight: 10 },
  ]);

  const [mode, setMode] = useState('move'); 
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [startNode, setStartNode] = useState(0);
  const [endNode, setEndNode] = useState(3);
  
  const [algorithm, setAlgorithm] = useState('dijkstra'); 
  const [executionTime, setExecutionTime] = useState(null); 
  
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null); 

  const svgRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleReset = () => {
    setNodes([]); 
    setEdges([]); 
    setStartNode(0);
    setEndNode(1);
    setExecutionTime(null);
    setLogs([]); 
    
    document.querySelectorAll('circle').forEach(c => c.setAttribute('fill', '#f0f0f0'));
    document.querySelectorAll('line').forEach(l => {
        l.setAttribute('stroke', 'black');
        l.setAttribute('stroke-width', '2');
    });
  };
  
  const handleSvgClick = (e) => {
    if (mode === 'node') {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
      setNodes([...nodes, { id: newId, x, y }]);
    }
  };

  const handleNodeClick = (e, id) => {
    e.stopPropagation(); 
    if (mode === 'edge') {
      if (selectedNode === null) {
        setSelectedNode(id);
      } else {
        if (selectedNode === id) {
          setSelectedNode(null);
        } else {
          const weight = prompt("Enter Weight:", "1");
          if (weight !== null) {
            setEdges([...edges, { from: selectedNode, to: id, weight: parseInt(weight) || 1 }]);
          }
          setSelectedNode(null);
        }
      }
    } else if (mode === 'delete') {
      setNodes(nodes.filter(n => n.id !== id));
      setEdges(edges.filter(e => e.from !== id && e.to !== id));
    }
  };

  const handleWeightClick = (e, index) => {
    e.stopPropagation();
    const currentWeight = edges[index].weight;
    const newWeight = prompt("Update Weight:", currentWeight);
    if (newWeight !== null) {
      const updatedEdges = [...edges];
      updatedEdges[index].weight = parseInt(newWeight) || 1;
      setEdges(updatedEdges);
    }
  };

  const handleMouseDown = (e, id) => {
    if (mode === 'move') {
      e.stopPropagation();
      setDraggingNode(id);
    }
  };

  const handleMouseMove = (e) => {
    if (draggingNode !== null && mode === 'move') {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setNodes(nodes.map(n => n.id === draggingNode ? { ...n, x, y } : n));
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  const runAlgorithm = async () => {
    const payload = { nodes, edges, start: startNode, end: endNode, algorithm };
    
    setExecutionTime(null);
    setLogs([]); 
    
    document.querySelectorAll('circle').forEach(c => c.setAttribute('fill', '#f0f0f0'));
    document.querySelectorAll('line').forEach(l => { 
        l.setAttribute('stroke', 'black'); 
        l.setAttribute('stroke-width', '2'); 
    });

    try {
      const response = await fetch('http://127.0.0.1:5000/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setExecutionTime(data.time);
      animateGraph(data.steps);
    } catch (err) {
      alert("Backend not connected! Start python server.");
    }
  };

  const animateGraph = (steps) => {
    steps.forEach((step, i) => {
      setTimeout(() => {
        
        let message = "";
        if (step.type === 'VISIT') message = `Visiting Node ${step.node}`;
        if (step.type === 'CHECK') message = `Checking neighbor ${step.to} (Weight: ${step.weight})`;
        if (step.type === 'FOUND') message = `Target Node ${step.node} Found!`;
        
        if (step.type === 'PATH') {
             message = `Final Path: ${step.path.join(" --> ")}`;
        }
        
        if (message) {
            setLogs(prev => [...prev, message]);
        }

        
        if (step.type === 'VISIT') {
             const nodeEl = document.getElementById(`node-${step.node}`);
             if (nodeEl) nodeEl.setAttribute('fill', 'yellow'); 
             if (step.came_from !== null && step.came_from !== undefined) {
                 const min = Math.min(step.came_from, step.node);
                 const max = Math.max(step.came_from, step.node);
                 const lineEl = document.getElementById(`line-${min}-${max}`);
                 if (lineEl) {
                     lineEl.setAttribute('stroke', '#007bff'); 
                     lineEl.setAttribute('stroke-width', '4');
                 }
             }
        }
        
        if (step.type === 'CHECK') {
             const min = Math.min(step.from, step.to);
             const max = Math.max(step.from, step.to);
             const lineEl = document.getElementById(`line-${min}-${max}`);
             if (lineEl) {
                 const oldColor = lineEl.getAttribute('stroke');
                 if (oldColor !== '#007bff' && oldColor !== '#28a745') {
                    lineEl.setAttribute('stroke', 'orange');
                    lineEl.setAttribute('stroke-width', '4');
                    setTimeout(() => {
                        const currentColor = lineEl.getAttribute('stroke');
                        if (currentColor === 'orange' && document.getElementById(`node-${step.to}`).getAttribute('fill') !== 'orange') {
                            lineEl.setAttribute('stroke', 'black');
                            lineEl.setAttribute('stroke-width', '2');
                        }
                    }, 400); 
                 }
             }
        }

        if (step.type === 'FOUND') {
            const nodeEl = document.getElementById(`node-${step.node}`);
            if (nodeEl) nodeEl.setAttribute('fill', '#28a745');
        }

        if (step.type === 'PATH') {
            const path = step.path;
            for (let j = 0; j < path.length - 1; j++) {
                const u = path[j];
                const v = path[j+1];
                const min = Math.min(u, v);
                const max = Math.max(u, v);
                const lineEl = document.getElementById(`line-${min}-${max}`);
                if (lineEl) {
                    lineEl.setAttribute('stroke', '#28a745'); 
                    lineEl.setAttribute('stroke-width', '6'); 
                }
                const nodeEl = document.getElementById(`node-${u}`);
                if (nodeEl) nodeEl.setAttribute('fill', '#28a745');
            }
        }

      }, 700 * i);
    });
  };

  return (
    <div className="App" onMouseUp={handleMouseUp}>
      <h1>Graph Visualizer</h1>
      
      <div className="toolbar">
        <button className={mode === 'move' ? 'active' : ''} onClick={() => setMode('move')}>Move</button>
        <button className={mode === 'node' ? 'active' : ''} onClick={() => setMode('node')}>Add Node</button>
        <button className={mode === 'edge' ? 'active' : ''} onClick={() => setMode('edge')}>Add Edge</button>
        <button className={mode === 'delete' ? 'active' : ''} onClick={() => setMode('delete')}>Delete</button>
        <button onClick={handleReset} style={{background: '#dc3545', color: 'white', borderColor: '#dc3545'}}>Reset</button>
        
        <span style={{marginLeft: '20px', fontSize: '14px'}}>
           Start: <input type="number" value={startNode} onChange={e => setStartNode(parseInt(e.target.value))} style={{width: '30px'}}/>
           End: <input type="number" value={endNode} onChange={e => setEndNode(parseInt(e.target.value))} style={{width: '30px'}}/>
        </span>

        <select 
            value={algorithm} 
            onChange={(e) => setAlgorithm(e.target.value)}
            style={{marginLeft: '10px', padding: '5px', borderRadius: '5px', cursor: 'pointer'}}
        >
            <option value="dijkstra">Dijkstra</option>
            <option value="astar">A* Search</option>
        </select>

        <button onClick={runAlgorithm} style={{background: '#007bff', color: 'white', borderColor: '#007bff'}}>Run</button>
      </div>

      {executionTime !== null && (
        <div style={{marginBottom: '10px', fontSize: '18px', fontWeight: 'bold', color: '#28a745'}}>
            Algorithm Time: {executionTime} ms
        </div>
      )}

      {/* --- FLEX CONTAINER --- */}
      <div style={{display: 'flex', justifyContent: 'center', gap: '20px'}}>
          
          {}
          <svg 
            ref={svgRef}
            width="800" height="500" 
            style={{border: '2px solid #333', background: '#f8f9fa', cursor: mode === 'move' ? 'grab' : 'crosshair', userSelect: 'none'}}
            onClick={handleSvgClick}
            onMouseMove={handleMouseMove}
          >
            {edges.map((edge, i) => {
              const n1 = nodes.find(n => n.id === edge.from);
              const n2 = nodes.find(n => n.id === edge.to);
              if (!n1 || !n2) return null;
              
              const lineId = `line-${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`;

              return (
                <g key={i}>
                  <line 
                    id={lineId}
                    x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} 
                    stroke="black" strokeWidth="2" 
                    style={{transition: 'stroke 0.3s'}}
                  />
                  <g 
                    onClick={(e) => handleWeightClick(e, i)} 
                    style={{cursor: 'pointer'}}
                  >
                    <circle cx={(n1.x + n2.x)/2} cy={(n1.y + n2.y)/2} r="12" fill="white" stroke="#333" strokeWidth="1"/>
                    <text 
                      x={(n1.x + n2.x)/2} y={(n1.y + n2.y)/2} 
                      dy="4" textAnchor="middle" fontSize="12" fontWeight="bold"
                      pointerEvents="none"
                    >
                      {edge.weight}
                    </text>
                  </g>
                </g>
              );
            })}

            {nodes.map((node) => (
              <g 
                key={node.id} 
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={(e) => handleNodeClick(e, node.id)}
                style={{cursor: mode === 'move' ? 'grabbing' : 'pointer'}}
              >
                <circle 
                  id={`node-${node.id}`}
                  r="25" 
                  fill={selectedNode === node.id ? '#17a2b8' : '#f0f0f0'} 
                  stroke="#333" 
                  strokeWidth="2"
                  style={{transition: 'fill 0.2s'}}
                />
                <text 
                  dy="5" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#333"
                  pointerEvents="none" 
                >
                  {node.id}
                </text>
              </g>
            ))}
          </svg>

          {}
          <div style={{
              width: '300px', 
              height: '480px', 
              border: '2px solid #333', 
              background: 'white',   
              color: 'red',          
              fontFamily: 'monospace', 
              overflowY: 'auto',
              overflowX: 'auto',     
              whiteSpace: 'nowrap',  
              padding: '10px',
              textAlign: 'left',
              fontSize: '13px'
          }}>
              <div style={{
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '5px', 
                  marginBottom: '5px', 
                  fontWeight: 'bold', 
                  color: 'black' 
              }}>
                  Steps
              </div>
              
              {logs.length === 0 && <span style={{color: '#999'}}>Waiting to run...</span>}
              
              {logs.map((log, index) => (
                  <div key={index} style={{marginBottom: '4px'}}>
                      <span style={{color: 'black', fontWeight: 'bold'}}>[{index + 1}]</span> {log}
                  </div>
              ))}
              <div ref={logsEndRef} />
          </div>

      </div>
    </div>
  );
}

export default App;