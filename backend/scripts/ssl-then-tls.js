const net = require('net');
const tls = require('tls');
const host = 'dpg-d7dsgt7lk1mc73evsht0-a.oregon-postgres.render.com';
const port = 5432;
const socket = net.createConnection(port, host, () => {
  console.log('connected tcp');
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(8, 0);
  buf.writeUInt32BE(80877103, 4);
  socket.write(buf);
});

socket.on('data', (data) => {
  console.log('ssl request response', data.toString('hex'));
  if (data.toString() === 'S') {
    console.log('server accepts ssl, upgrading');
    const secureSocket = tls.connect({ socket, rejectUnauthorized: false, servername: host }, () => {
      console.log('tls connected', secureSocket.authorized, secureSocket.authorizationError, secureSocket.getProtocol());
      secureSocket.end();
    });
    secureSocket.on('error', (err) => console.error('tls error', err));
    secureSocket.on('close', (had) => console.log('tls close', had));
  } else {
    console.log('server refused ssl');
    socket.end();
  }
});

socket.on('error', (err) => console.error('tcp error', err));
socket.on('close', (had) => console.log('tcp close', had));
