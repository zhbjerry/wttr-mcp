#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getWeather } from './weather.js';

const server = new McpServer({ name: 'local-wttr-mcp', version: '1.0.0' });
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

await server.connect(new StdioServerTransport());
