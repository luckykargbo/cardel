'use strict';
/**
 * SALONEAUTOLINK — NETLIFY FUNCTION ENTRY POINT
 */

const path = require('path');
const serverless = require('serverless-http');

const serverAppPath = path.resolve(__dirname, '../../server.js');
const app = require(serverAppPath);

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  try {
    return await serverlessHandler(event, context);
  } catch (err) {
    console.error('Netlify Function execution error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: err.message || 'Server error.' }),
    };
  }
};
