import { createServer } from '../dist/server/production.mjs';
import serverless from 'serverless-http';

const app = createServer();

export default serverless(app);
