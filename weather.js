export async function getWeather({ location, days = 3, language } = {}, fetchImpl = fetch) {
  const url = new URL(`https://wttr.in/${location ? encodeURIComponent(location) : ''}`);
  url.searchParams.set('format', 'j1');
  if (language) url.searchParams.set('lang', language);
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'local-wttr-mcp/1.0' },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new Error(`Unable to reach wttr.in: ${error.message}`, { cause: error });
  }
  if (!response.ok) throw new Error(`wttr.in returned HTTP ${response.status}`);
  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error('wttr.in returned invalid JSON', { cause: error });
  }
  if (!Array.isArray(data.current_condition) || !Array.isArray(data.weather)) {
    throw new Error('wttr.in returned an unexpected weather response');
  }
  return { nearest_area: data.nearest_area, current_condition: data.current_condition, weather: data.weather.slice(0, days) };
}
