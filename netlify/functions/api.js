'use strict';
/**
 * SALONEAUTOLINK — NETLIFY FUNCTION ENTRY POINT
 * Wraps Express application with serverless-http for Netlify Functions execution.
 */

const serverless = require('serverless-http');

let app = null;
let initError = null;

try {
  app = require('../../server');
} catch (err) {
  initError = err;
  console.error('FATAL Server Require Error:', err);
}

const serverlessHandler = app ? serverless(app) : null;

module.exports.handler = async (event, context) => {
  if (!serverlessHandler) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Server failed to start.',
        error: initError ? initError.message : 'Unknown error'
      }),
    };
  }
  try {
    return await serverlessHandler(event, context);
  } catch (err) {
    console.error('Serverless Execution Error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: err.message || 'Execution error.' }),
    };
  }
};
