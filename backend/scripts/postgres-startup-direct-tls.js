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

const socket = tls.connect({ host, port, rejectUnauthorized: false, servername: host, minVersion: 'TLSv1.2', maxVersion: 'TLSv1.3' }, () => {
  console.log('tls connected', socket.authorized, socket.authorizationError, socket.getProtocol());
  socket.write(startup);
  console.log('startup sent');
});

socket.on('data', (data) => {
  console.log('data', data.toString('hex'));
  console.log('ascii', JSON.stringify(data.toString('ascii')));
  socket.destroy();
});

socket.on('error', (err) => console.error('err', err));
socket.on('close', (had) => console.log('close', had));
