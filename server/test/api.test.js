const request = require('supertest');
const { start, stop } = require('../app');

let serverObj;
let BASE;

beforeAll(async () => {
  serverObj = await start(0); // port 0 -> random available
  const port = serverObj.server.address().port;
  BASE = `http://localhost:${port}`;
});

afterAll(async () => {
  await stop(serverObj);
});

describe('Cosy Game Zone API (integration smoke)', () => {
  test('GET / health', async () => {
    const res = await request(BASE).get('/');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('GET /api/games', async () => {
    const res = await request(BASE).get('/api/games');
    expect(res.status).toBe(200);
    // route returns array directly or wrapped - accept both
    expect(Array.isArray(res.body) || Array.isArray(res.body.games)).toBe(true);
  });

  // register -> me
  let token = null;
  const email = `test+${Date.now()}@example.test`;

  test('POST /api/auth/register and /api/auth/me', async () => {
    const reg = await request(BASE).post('/api/auth/register').send({ username: 'testuser', email, password: 'pass1234' });
    expect(reg.status).toBe(200);
    expect(reg.body.ok).toBe(true);
    expect(reg.body.token).toBeTruthy();
    token = reg.body.token;

    const me = await request(BASE).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user).toBeTruthy();
  });

  test('POST /api/leaderboard/submit', async () => {
    const res = await request(BASE).post('/api/leaderboard/submit').send({ name: 'tester', score: 12345 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.leaderboard) || Array.isArray(res.body)).toBe(true);
  });
});
