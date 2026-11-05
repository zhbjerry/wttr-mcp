# wttr.in Weather MCP

An open-source stdio MCP server backed by [wttr.in](https://github.com/chubin/wttr.in). It exposes a convenient structured weather tool and a general request tool for the documented wttr.in formats.

## Install

Requires Node.js 20 or newer and network access to `https://wttr.in`.

```bash
npx -y wttr-in-mcp
```

The server communicates over stdio and waits for an MCP client after startup. It does not open an HTTP port.

## MCP client configuration

```bash
npm install wttr-in-mcp
```

For clients that support `npx`, add:

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "wttr-in-mcp"]
    }
  }
}
```

## Tools

### `get_weather`

Returns the complete wttr.in JSON response, with the forecast limited to the requested number of days. The original `astronomy.moon_phase`, `moon_illumination`, `moonrise`, and `moonset` fields are preserved. Each moon phase entry also includes `moon_phase_emoji` using the wttr.in mapping:

| Phase | Emoji |
| --- | --- |
| New Moon | 🌑 |
| Waxing Crescent | 🌒 |
| First Quarter | 🌓 |
| Waxing Gibbous | 🌔 |
| Full Moon | 🌕 |
| Waning Gibbous | 🌖 |
| Last/Third Quarter | 🌗 |
| Waning Crescent | 🌘 |

Arguments:

- `location`: a city, airport code, or `latitude,longitude`. Omit it to let wttr.in locate the server by IP.
- `days`: `1` to `3`, defaulting to `3`.
- `language`: an optional wttr.in language code such as `zh` or `en`.

The response preserves all top-level fields and units returned by wttr.in.

### `wttr_request`

Provides access to the documented wttr.in output formats:

| `format` | Output | Typical `formatCode` |
| --- | --- | --- |
| `json` | Full structured JSON | `j1` or `j2` |
| `text` | Plain text, custom text, or ANSI-compatible output | `1`, `2`, `3`, `4`, `%l:+%c+%t`, `%m` |
| `html` | HTML weather page | omit |
| `prometheus` | Prometheus metrics | `p1` |
| `png` | PNG image returned as MCP image content | omit |
| `moon` | JSON moon-phase data | `j1` |

Arguments:

- `location`: city, airport code, coordinates, IP, domain, `Moon`, `Moon@2026-11-05`, or multiple locations separated by `:`.
- `format`: one of `json`, `text`, `html`, `prometheus`, `png`, or `moon`.
- `formatCode`: a wttr.in format code such as `j1`, `j2`, `p1`, `3`, or `%m`.
- `shortOptions`: short options such as `m`, `u`, `M`, `0`, `1`, `2`, `q`, `T`, or PNG options such as `0tqp`.
- `params`: additional query parameters such as `{ "lang": "zh" }`, `{ "m": "" }`, or `{ "transparency": "150" }`.

Examples:

```json
{"location":"Shanghai","format":"json","formatCode":"j2","params":{"lang":"zh","m":""}}
{"location":"London","format":"text","formatCode":"%m"}
{"location":"Moon@2026-11-05","format":"text","formatCode":"%m"}
{"location":"Paris","format":"png","shortOptions":"0qp"}
{"location":"Detroit","format":"prometheus","formatCode":"p1"}
```

The server supports the public URL and output conventions documented by wttr.in. It does not proxy undocumented internal endpoints.

## Development

```bash
npm install
npm test
```

## Open source

This project is released under the MIT License. Weather data is provided by wttr.in; please review its service terms and usage limits before deploying at scale. Contributions and bug reports are welcome through GitHub Issues and Pull Requests.
