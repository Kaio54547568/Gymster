const fs = require('fs');

let code = fs.readFileSync('backend/server.js', 'utf8');
code = code.replace('verifyRegistrationCode,', 'verifyRegistrationCode,\n  registerAccount,');

let apiHandler = `  if (request.method === "POST" && url.pathname === "/api/auth/register") {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await registerAccount(payload);
    sendJson(response, result.ok ? 200 : 400, result);
    return;
  }\n\n`;

code = code.replace(
  'if (request.method === "POST" && url.pathname === "/api/auth/register/request-code") {',
  apiHandler + '  if (request.method === "POST" && url.pathname === "/api/auth/register/request-code") {'
);

fs.writeFileSync('backend/server.js', code);
console.log('Fixed server.js');
