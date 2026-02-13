import nodeWindows from 'node-windows';
import * as path from 'node:path';
const Service = nodeWindows.Service;

// Create a new service object
const svc = new Service({
  name: 'Timesheet tracker',
  description:
    'The service that tracks applications and websites for the timesheet tracker application',
  script: path.resolve('./api/src/main.js'),
  //, workingDirectory: '...'
  //, allowServiceLogon: true
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
  svc.start();
  console.log('Install complete.');
  console.log('The service exists: ', svc.exists);
});

svc.install();
