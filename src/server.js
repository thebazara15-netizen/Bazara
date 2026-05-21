// Root server entrypoint for deployment hosts that expect node src/server.js
const path = require('path');
const backendRoot = path.resolve(__dirname, '..', 'backend');
process.chdir(backendRoot);
require(path.join(backendRoot, 'src', 'server.js'));
