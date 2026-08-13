exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, message: 'BASE NETLIFY LAMBDA FUNCTION IS ALIVE' })
  };
};
