import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import QueryBuilder from './components/QueryBuilder'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <QueryBuilder/>
    </>
  )
}

export default App


// import React, { useState, useCallback } from 'react';
// import ReactFlow, {
//   ReactFlowProvider,
//   addEdge,
//   Background,
//   Controls,
// } from 'react-flow-renderer';
// import TableNode from './TableNode';
// import { Box } from '@mui/material';

// const initialNodes = [
//   {
//     id: '1',
//     type: 'tableNode',
//     data: { tableName: 'Users', columns: ['id', 'name', 'email'] },
//     position: { x: 50, y: 50 },
//   },
//   {
//     id: '2',
//     type: 'tableNode',
//     data: { tableName: 'Orders', columns: ['id', 'user_id', 'amount'] },
//     position: { x: 300, y: 50 },
//   },
// ];

// const initialEdges = [];

// const nodeTypes = { tableNode: TableNode };

// function App() {
//   const [nodes, setNodes] = useState(initialNodes);
//   const [edges, setEdges] = useState(initialEdges);

//   const onConnect = useCallback(
//     (params) => setEdges((eds) => addEdge(params, eds)),
//     []
//   );

//   const onNodesChange = useCallback((changes) => setNodes((nds) => [...nds, ...changes]), []);
//   const onEdgesChange = useCallback((changes) => setEdges((eds) => [...eds, ...changes]), []);

//   return (
//     <ReactFlowProvider>
//       <Box sx={{ height: '100vh', width: '100vw' }}>
//         <ReactFlow
//           nodes={nodes}
//           edges={edges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onConnect={onConnect}
//           nodeTypes={nodeTypes}
//           fitView
//         >
//           <Controls />
//           <Background color="#aaa" gap={16} />
//         </ReactFlow>
//       </Box>
//     </ReactFlowProvider>
//   );
// }

// export default App;

