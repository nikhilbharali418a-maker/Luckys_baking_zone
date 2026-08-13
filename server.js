const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = Number(process.env.PORT) || 3016;
const ROOT_DIR = __dirname;
const ORDERS_FILE = path.join(ROOT_DIR, 'orders.json');

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    default: return 'text/plain; charset=utf-8';
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function readOrders() {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  });
}

function startServer(port) {
  const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (pathname === '/api/orders' && req.method === 'GET') {
    const orders = readOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    sendJson(res, 200, { orders });
    return;
  }

  if (pathname === '/api/orders' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const orders = readOrders();

        if (!payload.customerName || !payload.mobile || !payload.address) {
          sendJson(res, 400, { error: 'Name, mobile, and address are required.' });
          return;
        }

        const order = {
          id: `LC-${Date.now()}`,
          orderNumber: `${10000 + orders.length}`,
          customerName: payload.customerName,
          mobile: payload.mobile,
          address: payload.address,
          paymentMethod: payload.paymentMethod || 'UPI / GPay / PhonePe (Instant QR)',
          items: payload.items || [],
          totalAmount: payload.totalAmount || 0,
          status: 'Received',
          createdAt: new Date().toISOString()
        };

        orders.unshift(order);
        writeOrders(orders);
        sendJson(res, 201, order);
      } catch (error) {
        sendJson(res, 400, { error: 'Invalid JSON payload.' });
      }
    });
    return;
  }

  if (pathname === '/' || pathname === '/index.html') {
    serveStaticFile(res, path.join(ROOT_DIR, 'index.html'));
    return;
  }

  if (pathname === '/orders.html') {
    serveStaticFile(res, path.join(ROOT_DIR, 'orders.html'));
    return;
  }

  if (pathname === '/app.js') {
    serveStaticFile(res, path.join(ROOT_DIR, 'app.js'));
    return;
  }

  if (pathname === '/styles.css') {
    serveStaticFile(res, path.join(ROOT_DIR, 'styles.css'));
    return;
  }

  const filePath = path.join(ROOT_DIR, pathname.replace(/^\//, ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveStaticFile(res, filePath);
    return;
  }

  if (pathname.startsWith('/images/')) {
    serveStaticFile(res, filePath);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      startServer(port + 1);
      return;
    }
    console.error(error);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`luckys_baking_zone server running at http://localhost:${port}`);
  });
}

startServer(DEFAULT_PORT);
