import serverless from 'serverless-http';
import app from './index';

// Export handler for AWS Lambda
export const handler = serverless(app);

