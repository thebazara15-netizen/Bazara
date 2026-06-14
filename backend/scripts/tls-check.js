const tls = require('tls');
const host = 'dpg-d7dsgt7lk1mc73evsht0-a.oregon-postgres.render.com';
const port = 5432;
const socket = tls.connect({ host, port, rejectUnauthorized: false }, () => {
  console.log('tls connected', socket.authorized, socket.authorizationError);
  console.log('protocol', socket.getProtocol());
  socket.destroy();
});
socket.on('error', (err) => {
  console.error('tls error', err);
});
socket.on('close', (hadError) => {
  console.log('close', hadError);
});
