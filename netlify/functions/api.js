'use strict';
/**
 * SALONEAUTOLINK — NETLIFY SERVERLESS API ENTRY POINT
 */
const serverless = require('serverless-http');
const app        = require('../../api/index');

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  return await handler(event, context);
};
