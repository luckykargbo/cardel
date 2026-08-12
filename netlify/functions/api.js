'use strict';
/**
 * SALONEAUTOLINK — NETLIFY FUNCTION ENTRY POINT
 * Robust serverless-http wrapper with dynamic path resolution.
 */

const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

let app = null;
const possiblePaths = [
  path.resolve(__dirname, '../server.js'),
  path.resolve(__dirname, '../../server.js'),
  path.resolve(process.cwd(), 'server.js'),
  '/var/task/server.js'
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    try {
      app = require(p);
      console.log(`✅ Netlify Function successfully loaded Express app from: ${p}`);
      break;
    } catch (err) {
      console.error(`Failed loading app from ${p}:`, err);
    }
  }
}

const handler = app ? serverless(app) : null;

module.exports.handler = async (event, context) => {
  if (!handler) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Server initialization failed on Netlify.' }),
    };
  }
  try {
    return await handler(event, context);
  } catch (err) {
    console.error('Execution error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: err.message || 'Execution error.' }),
    };
  }
};
