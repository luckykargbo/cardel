'use strict';
/**
 * SALONEAUTOLINK — NETLIFY FUNCTION ENTRY POINT
 * Wraps Express application with serverless-http for Netlify Functions execution.
 */

const serverless = require('serverless-http');
const app = require('../server');

module.exports.handler = serverless(app);
