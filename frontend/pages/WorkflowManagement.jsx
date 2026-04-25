import { useMemo, useState, useCallback } from "react";
import { ReactFlowProvider, ReactFlow, applyEdgeChanges, applyNodeChanges, addEdge, Background, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useNavigate } from "react-router-dom";
import CustomNode from "../src/nodes/CustomNode";
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react";



const WorkflowManagement = () => {
    const navigate = useNavigate();
    const initialNode = [
        {
            id: "1",
            position: { x: 100, y: 100 },
            data: { label: "Start", isStart: true },
            draggable: false,
            selectable: false,
        },
    ];
    const initialEdges = [
        {
            id: "1-2",
            source: "1",
            target: null,
        },
    ];

    const [nodes, setNodes] = useState(initialNode);
    const [edges, setEdges] = useState(initialEdges);
    const [AgentName, setAgentName] = useState('');
    const [Description, setDescription] = useState('');
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    const nodeTypes = useMemo(() => ({
        custom: CustomNode,
    }), []);

    const onNodesChange = useCallback((changes) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    const onEdgesChange = useCallback((changes) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, []);

    const onConnect = useCallback((edge) => {
        setEdges((eds) => addEdge(edge, eds));
    }, []);

    const onEdgeClick = useCallback((event, edge) => {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }, []);
    const onNodeClick = useCallback((event, node) => {
        if (node.data.isStart) return;
        setSelectedNodeId(node.id);
        setAgentName(node.data.AgentName || '');
        setDescription(node.data.Description || '');
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
        setAgentName('');
        setDescription('');
    }, []);

    const addOrUpdateNode = () => {
        if (selectedNodeId) {
            // Update existing node
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === selectedNodeId) {
                        return {
                            ...node,
                            data: { ...node.data, AgentName: AgentName, Description: Description },
                        };
                    }
                    return node;
                })
            );
            setSelectedNodeId(null);
            setAgentName('');
            setDescription('');
        } else {
            // Add new node
            const id = Math.random().toString();
            const newNode = {
                id,
                type: 'custom',
                position: {
                    x: Math.random() * 400 + 100,
                    y: Math.random() * 400 + 100,
                },
                data: { AgentName: AgentName, Description: Description },
            };
            setNodes((nds) => nds.concat(newNode));
            setAgentName('');
            setDescription('');
        }
    };

    const deleteNode = () => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
        setSelectedNodeId(null);
        setAgentName('');
        setDescription('');
    };

    const onSave = () => {
        console.log("Saving Flow:", { nodes, edges });
        alert("Flow saved to console!");
    };

    return (
        <div className="flex flex-row-reverse h-[calc(100vh-2rem)] w-full bg-gray-50">
            {/* Sidebar Controls */}

            <div className="w-100 bg-white border-r border-gray-200 p-6 flex flex-col shadow-sm z-10">
                <ArrowLeft className="mt-2 w-7 h-7 hover:text-teal-600 cursor-pointer" onClick={() => { navigate("/admin") }} />
                <div className="mb-7 text-center">
                    <h2 className="mt-12 text-3xl font-bold text-gray-800 gap-2">
                        <span className="text-cyan-600">Workflow</span> Editor
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Design your process flow</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
                            {selectedNodeId ? 'Edit Node' : 'Add New Node'}
                        </h3>
                        {selectedNodeId && (
                            <button onClick={onPaneClick} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-600 ml-1">Agent</label>
                        <input
                            type="text"
                            placeholder="e.g. Authentication Agent"
                            value={AgentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-white"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-600 ml-1">Work Description</label>
                        <input
                            type="text"
                            placeholder="e.g. Verifying user credentials"
                            value={Description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-white"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={addOrUpdateNode}
                            disabled={!AgentName || !Description}
                            className={`flex-1 mt-2 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed ${selectedNodeId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {selectedNodeId ? <Save size={18} /> : <Plus size={18} />}
                            <span>{selectedNodeId ? 'Update' : 'Add'}</span>
                        </button>

                        {selectedNodeId && (
                            <button
                                onClick={deleteNode}
                                className="mt-2 bg-red-100 text-red-600 hover:bg-red-200 font-semibold py-2.5 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center active:scale-95"
                                title="Delete Node"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-4">
                    <button
                        onClick={onSave}
                        className="bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 w-full disabled:bg-gray-300 disabled:cursor-not-allowed"
                        disabled={!edges.some(e => e.source && e.target)}
                    >
                        <Save size={18} />
                        <span>Save Workflow</span>
                    </button>

                    <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-xs leading-relaxed border border-blue-100">
                        <strong>Tip:</strong> Select a node to edit or delete it. Click on empty space to deselect.
                    </div>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 h-full relative">
                <div className="w-full h-full">
                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onEdgeClick={onEdgeClick}
                            onPaneClick={onPaneClick}
                            fitView
                            className="bg-gray-50/50"
                        >
                            <Background variant="dots" gap={12} size={1} />
                            <Controls />
                            <MiniMap style={{ height: 90, width: 150 }} zoomable pannable />
                        </ReactFlow>
                    </ReactFlowProvider>
                </div>
            </div>
        </div>
    );
};

export default WorkflowManagement;
