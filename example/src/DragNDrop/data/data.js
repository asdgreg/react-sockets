import { useState, useCallback } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from 'react-flow-renderer';

const SaveRestore = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [rfInstance, setRfInstance] = useState(null);
    const { setViewport } = useReactFlow();
  
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
    const onSave = useCallback(() => {
      if (rfInstance) {
        const flow = rfInstance.toObject();
        localStorage.setItem(flowKey, JSON.stringify(flow));
      }
    }, [rfInstance]);
  
    const onRestore = useCallback(() => {
      const restoreFlow = async () => {
        const flow = JSON.parse(localStorage.getItem(flowKey));
  
        if (flow) {
          const { x = 0, y = 0, zoom = 1 } = flow.viewport;
          setNodes(flow.nodes || []);
          setEdges(flow.edges || []);
          setViewport({ x, y, zoom });
        }
      };
  
      restoreFlow();
    }, [setNodes, setViewport]);