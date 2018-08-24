const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const path = require('path');
const public = path.join(__dirname, 'public');
const io = require('socket.io')(http);
const guid = require('uuid/v1');
const fs = require('fs');
const THREE = require('three');
const BLOCK_SIZE = 10;

fs.readFile('world.json', 'utf8', (err, data) => {
  if (err) throw err;
  data = JSON.parse(data);
  let _WT = []
  for (var x = 0; x < 10; x++) {
    for (var z = 0; z < 10; z++) {
      _WT.push(
        { x: -100 + x * 10 + 5, y: Math.floor(Math.random() * 2) * 10 - 5, z: -100 + z * 10 + 5, materialIndex: 7, uuid: guid() })
    }
  }
  data.chunks[0].blocks = _WT
  let stream = fs.createWriteStream('world.json');
  stream.once('open', (fd) => {
    stream.write(JSON.stringify(data));
    stream.end();
  });
})

app.use('/', express.static(public));

io.on('connection', (socket) => {

  fs.readFile('world.json', 'utf8', (err, data) => {
    if (err) throw err;
    io.to(`${socket.id}`).emit('world', data)
  })

  socket.on('request_update', (position, rotation) => {
    socket.broadcast.emit('update', position, rotation);
  })

  socket.on('message', (message) => {
    io.emit('message', message);
  })

  socket.on('addBlock', (block, materialIndex) => {
    const uuid = guid();
    let pos = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE));
    pos.position.copy(block.point).add(block.face.normal).divideScalar(BLOCK_SIZE).floor().multiplyScalar(BLOCK_SIZE).addScalar(BLOCK_SIZE / 2);
    fs.readFile('world.json', 'utf8', (err, data) => {
      if (err) throw err;
      data = JSON.parse(data);
      data.chunks[0].blocks.push({ x: pos.position.x, y: pos.position.y, z: pos.position.z, materialIndex, uuid })
      let stream = fs.createWriteStream('world.json');
      stream.once('open', (fd) => {
        stream.write(JSON.stringify(data));
        stream.end();
      });
    })
    io.emit('addBlock', block, materialIndex, uuid);
  })

  socket.on('removeBlock', (block) => {
    fs.readFile('world.json', 'utf8', (err, data) => {
      if (err) throw err;
      data = JSON.parse(data);
      // console.log()
      data.chunks[0].blocks = data.chunks[0].blocks.filter(e => e.uuid != block.object.object.uuid)
      let stream = fs.createWriteStream('world.json');
      stream.once('open', (fd) => {
        stream.write(JSON.stringify(data));
        stream.end();
      });
    })
    io.emit('removeBlock', block);
  })

  socket.on('disconnect', () => {

  });
});

http.listen(process.env.PORT || 5000, () => console.log(`Listening on w/e`));
