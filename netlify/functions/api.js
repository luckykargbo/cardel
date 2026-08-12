'use strict';

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, message: 'NETLIFY FUNCTION PURE TEST' }),
  };
};
