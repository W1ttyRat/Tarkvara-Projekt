const http = require('http');

function getCsrf() {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: 3000, path: '/api/csrf-token', method: 'GET' };
    const req = http.request(options, (res) => {
      const cookies = res.headers['set-cookie'] || [];
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ token: parsed.csrfToken, cookies });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function postCheckFit(token, cookies) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ registration_number: 'TEST', locationId: 1 });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/check-fit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Accept': 'application/json',
        'x-csrf-token': token,
        'Cookie': cookies.join('; ')
      }
    };

    const req = http.request(options, (res) => {
      console.log('STATUS', res.statusCode);
      console.log('HEADERS', res.headers);
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => { resolve({ status: res.statusCode, headers: res.headers, body }); });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const { token, cookies } = await getCsrf();
    console.log('token', token);
    console.log('cookies', cookies);
    const res = await postCheckFit(token, cookies);
    console.log('response body:', res.body);
  } catch (err) {
    console.error('error', err);
  }
})();
