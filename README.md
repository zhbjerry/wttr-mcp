# wttr.in Weather MCP

An open-source stdio MCP server backed by the [wttr.in](https://github.com/chubin/wttr.in) JSON API. It exposes one `get_weather` tool for current conditions and forecasts of up to three days.

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

The `get_weather` arguments are:

- `location`: a city, airport code, or `latitude,longitude`. Omit it to let wttr.in locate the server by IP.
- `days`: `1` to `3`, defaulting to `3`.
- `language`: an optional wttr.in language code such as `zh` or `en`.

The response preserves the structured fields and units returned by wttr.in.

## Development

```bash
npm install
npm test
```

## Open source

This project is released under the MIT License. Weather data is provided by wttr.in; please review its service terms and usage limits before deploying at scale. Contributions and bug reports are welcome through GitHub Issues and Pull Requests.
