import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeather } from './weather.js';

test('encodes locations and returns the requested forecast days', async () => {
  let requested;
  const result = await getWeather({ location: 'New York', days: 1, language: 'zh' }, async (url) => {
    requested = url;
    return new Response(JSON.stringify({ nearest_area: [], current_condition: [{}], weather: [{ date: 'a' }, { date: 'b' }] }));
  });
  assert.equal(requested.pathname, '/New%20York');
  assert.equal(requested.searchParams.get('format'), 'j1');
  assert.equal(requested.searchParams.get('lang'), 'zh');
  assert.equal(result.weather.length, 1);
});

test('reports upstream errors and invalid responses', async () => {
  await assert.rejects(getWeather({}, async () => new Response('', { status: 503 })), /HTTP 503/);
  await assert.rejects(getWeather({}, async () => new Response('not json')), /invalid JSON/);
  await assert.rejects(getWeather({}, async () => new Response('{}')), /unexpected weather response/);
});
