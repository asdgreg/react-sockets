// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const express = require('express');
const {getRoomFromCache, addMessageToCache} = require('./firebase');
const {addUser, getUser, deleteUser} = require('./users');

// const app = express();
// app.use(express.static(__dirname + '/public'));

// Serve frontend
// app.get('/', async (req, res) => {
//   res.render('index');
// });

// [START cloudrun_websockets_server]
// Initialize Socket.io
// const server = require('http').Server(app);
const io = require('socket.io')();

// [START cloudrun_websockets_redis_adapter]
// const redisAdapter = require('@socket.io/redis-adapter');
// Replace in-memory adapter with Redis
// const subClient = redisClient.duplicate();
// io.adapter(redisAdapter(redisClient, subClient));
// [END cloudrun_websockets_redis_adapter]
// Add error handlers
// redisClient.on('error', err => {
//   console.error(err.message);
// });

// subClient.on('error', err => {
//   console.error(err.message);
// });

// Listen for new connection
io.on('connection', socket => {
  console.log(`connect: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`disconnect: ${socket.id}`);
  });

  socket.on('ping', (data) => {
    console.log(`ping ffrom : ${socket.id} and ${data}`);
  });
  
  socket.on('updateNode', (data) => {
    console.log(`node updated from : ${socket.id} nodeId ${data}`);
    socket.in(data.processId).emit('notification_update', {
      title: "Someone's update the node in this room",
      description: `${data.id} was the node updated: ${data}`,
      data: JSON.parse(data)
    });
  
  });

  // Add listener for "signin" event
  socket.on('signin', async ({user, room}, callback) => {
    try {
      // Record socket ID to user's name and chat room
      addUser(socket.id, user, room);
      // Call join to subscribe the socket to a given channel
      socket.join(room);
      // Emit notification event
      socket.in(room).emit('notification', {
        title: "Someone's here",
        description: `${user} just entered the process flow`,
      });
      // Retrieve room's message history or return null
    //   const messages = {}//await getRoomFromCache(room);
      // const messages = await getRoomFromCache(room);
      // Use the callback to respond with the room's message history
      // Callbacks are more commonly used for event listeners than promises
      callback(null, {"status":"success"});
    } catch (err) {
      callback(err, null);
    }
  });

  // [START cloudrun_websockets_update_socket]
  // Add listener for "updateSocketId" event
  socket.on('updateSocketId', async ({user, room}) => {
    try {
      addUser(socket.id, user, room);
      socket.join(room);
    } catch (err) {
      console.error(err);
    }
  });
  // [END cloudrun_websockets_update_socket]

  // Add listener for "sendMessage" event
  socket.on('sendMessage', (message, callback) => {
    // Retrieve user's name and chat room  from socket ID
    const {user, room} = getUser(socket.id);
    if (room) {
      const msg = {user, text: message};
      // Push message to clients in chat room
      io.in(room).emit('message', msg);
      addMessageToCache(room, msg);
      callback();
    } else {
      callback('User session not found.');
    }
  });

  // Add listener for disconnection
  socket.on('disconnect', () => {
    // Remove socket ID from list
    const {user, room} = deleteUser(socket.id);
    if (user) {
      io.in(room).emit('notification', {
        title: 'Someone just left',
        description: `${user} just left the room`,
      });
    }
  });
});
// [END cloudrun_websockets_server]https://970-cs-963786369138-default.cs-us-east1-pkhd.cloudshell.dev/files/download/?id=b968de73-624e-4566-91dc-368469c3b2b3

module.exports = io;
