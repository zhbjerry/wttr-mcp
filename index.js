#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getWeather, requestWttr } from './weather.js';

const server = new McpServer({ name: 'wttr-in-mcp', version: '1.1.0' });
server.registerTool('get_weather', {
  description: 'Get current weather and a forecast of up to three days from wttr.in. Omit location to use the server IP location.',
  inputSchema: {
    location: z.string().trim().min(1).max(200).optional().describe('City, airport code, or latitude,longitude. Omit for server IP location.'),
    days: z.number().int().min(1).max(3).default(3).describe('Number of forecast days to return, from 1 to 3.'),
    language: z.string().regex(/^[a-z]{2,3}(?:-[a-z]{2,4})?$/i).optional().describe('Optional wttr.in language code, for example zh or en.'),
  },
}, async (input) => {
  try {
    const weather = await getWeather(input);
    return { content: [{ type: 'text', text: JSON.stringify(weather, null, 2) }] };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: `Weather request failed: ${error.message}` }] };
  }
});

server.registerTool('wttr_request', {
  description: 'Access documented wttr.in output formats and query options, including JSON, text, HTML, Prometheus, PNG, custom formats, and moon phase emoji.',
  inputSchema: {
    location: z.string().trim().max(300).optional().describe('City, airport code, coordinates, IP, domain, Moon, or multiple locations separated by :. Omit for server IP location.'),
    format: z.enum(['json', 'text', 'html', 'prometheus', 'png', 'moon']).default('json').describe('Output format. Use moon for JSON moon phase data, or use formatCode %m for the moon emoji.'),
    formatCode: z.string().max(200).optional().describe('wttr.in format code, such as j1, j2, p1, 3, or %m.'),
    shortOptions: z.string().regex(/^[A-Za-z0-9Tq]+$/).max(30).optional().describe('Short wttr.in options, or PNG options such as 0tqp.'),
    params: z.record(z.string(), z.string()).optional().describe('Additional wttr.in query parameters, such as lang=zh, m, u, M, or transparency=150.'),
  },
}, async (input) => {
  try {
    const result = await requestWttr(input);
    if (result.kind === 'image') return { content: [{ type: 'image', data: result.data, mimeType: result.mimeType }] };
    if (result.kind === 'json') return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    return { content: [{ type: 'text', text: result.data }] };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: `wttr.in request failed: ${error.message}` }] };
  }
});

await server.connect(new StdioServerTransport());
