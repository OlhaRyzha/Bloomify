import { createServer } from 'node:http';

const apiUrl = new URL(process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:8010');
const port = Number(apiUrl.port || (apiUrl.protocol === 'https:' ? 443 : 80));
const hostname = apiUrl.hostname;

const catalogItems = [
  {
    id: 'white-harmony',
    name: 'Біла гармонія',
    description: 'Класична композиція з білих лілій та троянд',
    price: 1650,
    imageUrl: '/images/white-harmony.jpg',
    tag: 'Класика',
  },
  {
    id: 'blue-harmony',
    name: 'Блакитна гармонія',
    description: 'Витончений букет із білих лілій та гортензії',
    price: 1750,
    imageUrl: '/images/blue-harmony.jpg',
    tag: 'Класика',
  },
];

const json = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(body));
};

const readRequestBody = (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];

    request.on('data', (chunk) => chunks.push(chunk));
    request.on('error', reject);
    request.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      resolve(text ? JSON.parse(text) : {});
    });
  });

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', apiUrl);
  const pathname = requestUrl.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'OPTIONS') {
    json(response, 204, {});
    return;
  }

  if (request.method === 'GET' && pathname === '/site/languages') {
    json(response, 200, { enabledLocales: ['uk', 'en', 'pl'] });
    return;
  }

  if (request.method === 'GET' && pathname === '/products') {
    json(response, 200, catalogItems);
    return;
  }

  if (request.method === 'GET' && pathname.startsWith('/products/')) {
    const productId = pathname.split('/').at(-1);
    const product = catalogItems.find((item) => item.id === productId);

    json(response, product ? 200 : 404, product ?? { detail: 'Not found' });
    return;
  }

  if (request.method === 'POST' && pathname === '/orders/checkout') {
    const payload = await readRequestBody(request);

    json(response, 201, {
      orderId: 42,
      status: 'pending',
      paymentStatus: 'pending',
      paymentProvider: payload.paymentMethod,
      paymentMethod: payload.paymentMethod,
      liqpay: null,
    });
    return;
  }

  json(response, 404, { detail: 'Not found' });
});

server.listen(port, hostname, () => {
  console.log(`Playwright mock API listening on ${apiUrl.origin}`);
});
