import http from 'http';
// import http from 'https';

import expressServer from './server';
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

const cron = require('node-cron');
import syncData from './db.sync-up';

// Normalize port number which will expose server
const port = normalizePort(process.env.PORT || 3000);

// Instantiate the expressServer class
let expressInstance = new expressServer().expressInstance;

// Make port available within server
expressInstance.set('port', port);

// Creating object of key and certificate
// for SSL
// const options = {
//     key: fs.readFileSync("server.key"),
//     cert: fs.readFileSync("server.cert"),
// };

// Create the HTTP Express Server
// const server = http.createServer(options, expressInstance);
const server = http.createServer(expressInstance);


// Start listening on the specified Port (Default: 3000)
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Port Normalization
function normalizePort(val: number | string): number | string | boolean {
    const port: number = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(port)) {
        return val;
    } else if (port >= 0) {
        return port;
    } else {
        return false;
    }
}

function onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening(): void {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `Listetning on port ${addr.port}`;
    console.log(bind);
}

// for every 10 minutes
cron.schedule('*/30 * * * *', () => { 
    console.log('Syn up is started');
    // syncData()
});
