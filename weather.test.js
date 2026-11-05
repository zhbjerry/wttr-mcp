import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeather, moonPhaseEmoji, requestWttr } from './weather.js';

test('maps all documented moon phases to emoji', () => {
  assert.deepEqual(
    ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'].map(moonPhaseEmoji),
    ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
  );
});

test('returns complete JSON and enriches moon phase data', async () => {
  let requested;
  const result = await getWeather({ location: 'New York', days: 1, language: 'zh' }, async (url) => {
    requested = url;
    return new Response(JSON.stringify({ nearest_area: [], current_condition: [{}], weather: [
      { date: 'a', astronomy: [{ moon_phase: 'Full Moon' }], extra: 'preserved' },
      { date: 'b' },
    ], extra_top_level: true }));
  });
  assert.equal(requested.pathname, '/New%20York');
  assert.equal(requested.searchParams.get('format'), 'j1');
  assert.equal(requested.searchParams.get('lang'), 'zh');
  assert.equal(result.weather.length, 1);
  assert.equal(result.weather[0].astronomy[0].moon_phase_emoji, '🌕');
  assert.equal(result.weather[0].extra, 'preserved');
  assert.equal(result.extra_top_level, true);
});

test('supports text, Prometheus, HTML, and PNG response types', async () => {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url);
    if (url.pathname.endsWith('.png')) return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } });
    return new Response('weather output', { headers: { 'content-type': 'text/plain' } });
  };
  assert.equal((await requestWttr({ location: 'Moon@2026-11-05', format: 'text', formatCode: '%m' }, fakeFetch)).data, 'weather output');
  assert.equal((await requestWttr({ location: 'London', format: 'prometheus' }, fakeFetch)).kind, 'text');
  assert.equal((await requestWttr({ location: 'London', format: 'html' }, fakeFetch)).kind, 'text');
  assert.deepEqual((await requestWttr({ location: 'London', format: 'png', shortOptions: '0tqp' }, fakeFetch)).data, 'AQID');
  assert.equal(calls[3].pathname, '/London_0tqp.png');
});

test('reports upstream errors and invalid responses', async () => {
  await assert.rejects(requestWttr({}, async () => new Response('', { status: 503 })), /HTTP 503/);
  await assert.rejects(requestWttr({ format: 'json' }, async () => new Response('not json')), /invalid JSON/);
});
