const net = require('net');
const tls = require('tls');
const host = 'dpg-d7dsgt7lk1mc73evsht0-a.oregon-postgres.render.com';
const port = 5432;
const user = 'b2b_user';
const database = 'b2b_db_72l1';
const params = [
  Buffer.from('user\0'),
  Buffer.from(user + '\0'),
  Buffer.from('database\0'),
  Buffer.from(database + '\0'),
  Buffer.from('client_encoding\0UTF8\0'),
  Buffer.from('application_name\0pg-debug\0'),
  Buffer.from('\0'),
];
const payload = Buffer.concat([Buffer.from([0,0,3,0]), ...params]);
const lenBuf = Buffer.alloc(4);
lenBuf.writeUInt32BE(payload.length + 4, 0);
const startup = Buffer.concat([lenBuf, payload]);
console.log('startup len', startup.length);

const rawSocket = net.createConnection(port, host, () => {
  console.log('tcp connected');
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(8, 0);
  buf.writeUInt32BE(80877103, 4);
  rawSocket.write(buf);
});

rawSocket.on('data', (data) => {
  console.log('raw ssl response', data.toString('hex'));
  if (data.toString() === 'S') {
    const secure = tls.connect({ socket: rawSocket, rejectUnauthorized: false, servername: host, minVersion: 'TLSv1.2', maxVersion: 'TLSv1.2' }, () => {
      console.log('tls handshake ok', secure.authorized, secure.authorizationError, secure.getProtocol());
      secure.write(startup);
      console.log('startup sent');
    });
    secure.on('data', (d) => {
      console.log('secure data:', d.toString('hex'));
      console.log('secure ascii:', JSON.stringify(d.toString('ascii')));
    });
    secure.on('error', (err) => console.error('secure err', err));
    secure.on('close', (had) => console.log('secure close', had));
    setTimeout(() => {
      console.log('timed out closing secure socket');
      secure.destroy();
    }, 10000);
  } else {
    console.log('SSL not accepted');
    rawSocket.destroy();
  }
});

rawSocket.on('error', (err) => console.error('tcp err', err));
rawSocket.on('close', (had) => console.log('tcp close', had));
