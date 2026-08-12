'use strict';
/**
 * SALONEAUTOLINK — NETLIFY FUNCTION ENTRY POINT
 * Wraps Express application with serverless-http for Netlify Functions execution.
 */

const serverless = require('serverless-http');
const app = require('../server');

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  try {
    return await serverlessHandler(event, context);
  } catch (err) {
    console.error('Netlify function handler error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: err.message || 'Server error.' }),
    };
  }
};
