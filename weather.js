const WTTR_ORIGIN = 'https://wttr.in';
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

const MOON_PHASE_EMOJI = new Map([
  ['new moon', '🌑'],
  ['waxing crescent', '🌒'],
  ['first quarter', '🌓'],
  ['waxing gibbous', '🌔'],
  ['full moon', '🌕'],
  ['waning gibbous', '🌖'],
  ['last quarter', '🌗'],
  ['third quarter', '🌗'],
  ['waning crescent', '🌘'],
]);

export function moonPhaseEmoji(phase) {
  return MOON_PHASE_EMOJI.get(String(phase ?? '').trim().toLowerCase()) ?? null;
}

function encodeLocation(location) {
  return encodeURIComponent(location)
    .replace(/%3A/gi, ':')
    .replace(/%40/gi, '@')
    .replace(/%2C/gi, ',');
}

function applyMoonEmoji(value) {
  if (Array.isArray(value)) return value.map(applyMoonEmoji);
  if (!value || typeof value !== 'object') return value;
  const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, applyMoonEmoji(item)]));
  if (typeof result.moon_phase === 'string') result.moon_phase_emoji = moonPhaseEmoji(result.moon_phase);
  return result;
}

function buildUrl({ location, format = 'json', formatCode, shortOptions, params = {} } = {}) {
  const isPng = format === 'png';
  let path = location ? encodeLocation(location) : '';
  const query = new URLSearchParams();

  if (isPng) {
    const pngOptions = [shortOptions, ...Object.entries(params ?? {}).map(([key, value]) => `${key}=${value}`)].filter(Boolean);
    path += `${pngOptions.length ? `_${pngOptions.join('_')}` : ''}.png`;
  } else if (format === 'html') {
    query.set('T', '');
  } else if (format === 'json' || format === 'moon') {
    query.set('format', formatCode || 'j1');
  } else if (format === 'prometheus') {
    query.set('format', formatCode || 'p1');
  } else if (formatCode) {
    query.set('format', formatCode);
  } else if (format === 'text' && shortOptions) {
    query.set(shortOptions, '');
  }

  for (const [key, value] of Object.entries(isPng ? {} : (params ?? {}))) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }

  const url = new URL(path, WTTR_ORIGIN);
  url.search = query.toString();
  return url;
}

async function readResponse(response) {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new Error(`wttr.in response exceeds ${MAX_RESPONSE_BYTES} bytes`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_RESPONSE_BYTES) throw new Error(`wttr.in response exceeds ${MAX_RESPONSE_BYTES} bytes`);
  return Buffer.from(buffer);
}

export async function requestWttr(options = {}, fetchImpl = fetch) {
  const url = buildUrl(options);
  let response;
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: options.format === 'png' ? 'image/png' : '*/*',
        'User-Agent': 'wttr-in-mcp/1.1.0',
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new Error(`Unable to reach wttr.in: ${error.message}`, { cause: error });
  }
  if (!response.ok) throw new Error(`wttr.in returned HTTP ${response.status}`);
  const body = await readResponse(response);
  if (options.format === 'json' || options.format === 'moon') {
    let data;
    try {
      data = JSON.parse(body.toString('utf8'));
    } catch (error) {
      throw new Error('wttr.in returned invalid JSON', { cause: error });
    }
    return { kind: 'json', data: applyMoonEmoji(data), contentType: response.headers.get('content-type') || 'application/json' };
  }
  if (options.format === 'png') {
    return { kind: 'image', data: body.toString('base64'), mimeType: response.headers.get('content-type') || 'image/png' };
  }
  return { kind: 'text', data: body.toString('utf8'), contentType: response.headers.get('content-type') || 'text/plain' };
}

export async function getWeather({ location, days = 3, language } = {}, fetchImpl = fetch) {
  const result = await requestWttr({ location, format: 'json', params: { lang: language } }, fetchImpl);
  if (!Array.isArray(result.data.current_condition) || !Array.isArray(result.data.weather)) {
    throw new Error('wttr.in returned an unexpected weather response');
  }
  return { ...result.data, weather: result.data.weather.slice(0, days) };
}
