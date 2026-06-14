const net = require('net');
const host = 'dpg-d7dsgt7lk1mc73evsht0-a.oregon-postgres.render.com';
const port = 5432;
const socket = net.createConnection(port, host, () => {
  console.log('connected');
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(8, 0);
  buf.writeUInt32BE(80877103, 4);
  socket.write(buf);
});

socket.on('data', (data) => {
  console.log('data', data.toString('hex'));
  console.log('raw', data);
  socket.destroy();
});
socket.on('error', (err) => {
  console.error('error', err);
});
socket.on('close', (hadError) => {
  console.log('close', hadError);
});
