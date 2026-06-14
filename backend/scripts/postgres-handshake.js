const net = require('net');
const tls = require('tls');
const host = 'dpg-d7dsgt7lk1mc73evsht0-a.oregon-postgres.render.com';
const port = 5432;
const user = 'b2b_user';
const database = 'b2b_db_72l1';

const socket = net.createConnection(port, host, () => {
  console.log('tcp connected');
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(8, 0);
  buf.writeUInt32BE(80877103, 4);
  socket.write(buf);
});

socket.on('data', (data) => {
  console.log('ssl response', data.toString('hex'));
  if (data.toString() === 'S') {
    const secure = tls.connect({ socket, rejectUnauthorized: false, servername: host }, () => {
      console.log('tls handshake ok', secure.authorized, secure.authorizationError, secure.getProtocol());
      const userBuf = Buffer.from(user + '\0');
      const dbBuf = Buffer.from(database + '\0');
      const proto = Buffer.alloc(8);
      proto.writeUInt32BE(196608, 0); // protocol 3.0
      const payload = Buffer.concat([proto, Buffer.from('user\0'), userBuf, Buffer.from('database\0'), dbBuf, Buffer.from('\0')]);
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeUInt32BE(payload.length + 4, 0);
      secure.write(Buffer.concat([lenBuf, payload]));
    });
    secure.on('data', (d) => {
      console.log('pg response', d.toString('hex'));
      console.log('pg response ascii', d.toString('ascii'));
      secure.destroy();
    });
    secure.on('error', (err) => console.error('tls err', err));
    secure.on('close', (had) => console.log('tls close', had));
  } else {
    console.error('ssl not accepted');
    socket.end();
  }
});

socket.on('error', (err) => console.error('tcp err', err));
socket.on('close', (had) => console.log('tcp close', had));
