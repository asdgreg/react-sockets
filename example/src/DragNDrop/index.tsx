import { useState, DragEvent, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Controls,
  ReactFlowInstance,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  useReactFlow,
  applyNodeChanges,
  NodeChange,
} from 'react-flow-renderer';
import {io} from 'socket.io-client';
import {addData, getDataFirebase, getDataAll} from './data/firebase'

import Sidebar from './Sidebar';

import './dnd.css';


import TextUpdaterNode from './data/updater';

// const socket = io("localhost:3001");
const socket = io("https://process-sockets-x7hzxezygq-uc.a.run.app");


let initialNodes: Node[] = [
      // { id: 'a', type: 'input', data: { label: 'input node' }, position: { x: 250, y: 5 } },
      { id: '1', data: { label: 'Limpieza' }, position: { x: 100, y: 100 } },
      { id: '2', data: { label: 'Mantenimiento' }, position: { x: 100, y: 200 } },
      { id: '3', data: { label: 'Pintar' }, position: { x: 100, y: 300 } },
      { id: '4', data: { label: 'Lavar' }, position: { x: 100, y: 400 } },
      { id: '5', data: { label: 'Inicio' }, position: { x: 100, y: 500 } },
      { id: '6', data: { label: 'Final' }, position: { x: 100, y: 600 } },
      { id: '7', data: { label: 'Desicion' }, position: { x: 100, y: 700 } },
      { id: '8', data: { label: 'Evaluacion' }, position: { x: 100, y: 800 } },
      // { id: 'node-1', type: 'textUpdater', position: { x: 0, y: 0 }, data: { value: 123 } },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

const nodeTypes = { textUpdater: TextUpdaterNode };

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  console.log(event.clientX, event.clientY)
};

const onLoad = (reactFlowInstance: any) =>{
  // const data = await getDataAll();
  // initialNodes =data ? data: []
  // console.log(data);
}

let user="Greg"
let processId ="123456"
let id = 0;
const getId = () => `dndnode_${id++}`;

const DnDFlow = () => {
// Sockets
const [isConnected, setIsConnected] = useState(socket.connected);
const [lastPong, setLastPong] = useState(String);
useEffect(() => {

  socket.on('connect', async () => {
    // const data = await getDataAll();
    // initialNodes =data ? data: []
    // console.log(data);
    setIsConnected(true);

    socket.emit('signin', {user, processId}, (error:any, data:any) => {
      if (error) {
        console.error(error);
      } else {
        console.log("connected sigin", data )
      }
    });
  });

  socket.on('disconnect', () => {
    setIsConnected(false);
  });

  return () => {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('pong');
  };
}, []);


const updateProcessId = (val:any) => {
  processId = val;
}
  // const data = getDataAll();
  // initialNodes =data ? data: []
  // console.log(data);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>();
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // const onNodeMouseLeave = (event: MouseEvent, node: Node) => {
  //   // event.preventDefault();
  //   // event.dataTransfer.dropEffect = 'move';
    
  //   console.log(event, node)
  // };

  // const [nodeName, setNodeName] = useState('Node 1');

  const onConnect = (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds));
  const onInit = (rfi: ReactFlowInstance) => {
    setReactFlowInstance(rfi);
    console.log("loading instance")
    const data = getDataAll();
    initialNodes =data ? data: []
    console.log(data);
  } 
  // const onChange={(evt) => console.log(id, evt.target.value)}
  const onDrop = (event: DragEvent) => {
    event.preventDefault();

    if (reactFlowInstance) {
      const type = event.dataTransfer.getData('application/reactflow');
      const position = reactFlowInstance.project({ x: event.clientX, y: event.clientY - 40 });
      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    }
  };

  useEffect(() => {
    // console.log("rendering")
    socket.on('notification_update', async (data) => {
      // console.log("notification recibido", data)
      let dbdata = await getDataFirebase(data.data.id)
      setNodes((nds) =>
        nds.map((node) => {
          // console.log("rendering node : ", node)
          if (node.id === data.data.id) {
            // let data = getData(node.id).then(datnode => {
            //   node.data = datnode ? datnode.data : node.data;
            //   node.position.x =  datnode ? datnode.position.x : 0
            //   node.position.y =  datnode ? datnode.position.y : 0
            //   console.log("nodo actualizado ",node.id, " updated to x = ", node.position.x)
            // });
            if(dbdata){
              node.position.x = dbdata.position.x
              node.position.y = dbdata.position.y
            }
          }
          // console.log("compare", node)
          return node;
        })
      );
    });
    
  }, [setNodes]);



  const onNodesChange = (changes: any[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
    // console.log(!changes[0].dragging || !changes[0].selected)
    // if((changes[0].dragging != null && !changes[0].dragging )||(changes[0].selected != null && !changes[0].selected)){
    if(!changes[0].dragging && changes[0].dragging != null ){
      // console.log('there are a change, emit evet with ID = ' + changes[0].id)

      //save data
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === changes[0].id) {
            addData(node.id,node).then(()=>{
              const nodeData = {
                id: changes[0].id,
                type: "update",
                processId,
                user,
                changes,
                node
              }
              socket.emit("updateNode",JSON.stringify(nodeData));
            });
            // console.log(node)
          }
          return node;
        })
      );
    }

  };




  return (
    <div className="dndflow">
      <div>
      <h1>sockets</h1>  
      <div>
        <p>Connected: { '' + isConnected }</p>
        <p/><p/>
        {/* <input type="text" name="user" value={user}></input>
        <p/> 
        <input onChange={(evt) => updateProcessId(evt.target.value)} value={processId}></input> */}
      
        <form>
          <label>
            User:
            <input readOnly type="text" name="User" value={user}/>
          </label>
          <p/> 
          <label>
            ProcessId:
            <input readOnly type="text" name="processId" value={processId}/>
          </label>
        </form>
      </div>       
        
      </div>
      <ReactFlowProvider>
        <div className="reactflow-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onEdgesChange={onEdgesChange}
            onNodesChange={onNodesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            onLoad={onLoad}
            // onMouseLeave={onNodeMouseLeave}          
            >
            <Controls />
            <div className="save__controls">
              {/* <input value={nodeName} onChange={(evt) => setNodeName(evt.target.value)} /> */}
            </div>
          </ReactFlow>
        </div>
        <Sidebar />
      </ReactFlowProvider>
    </div>
  );
};

export default DnDFlow;
