# mcp-newsapi

Get top headlines, search news articles, and list sources via NewsAPI.

## Tools

| Tool | Description |
|------|-------------|
| `get_headlines` | Get top headlines. |
| `search_news` | Search news articles. |
| `get_sources` | List available news sources. |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NEWSAPI_KEY` | Yes | NewsAPI key (free at newsapi.org/register) |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-newsapi.git
cd mcp-newsapi
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "newsapi": {
      "command": "node",
      "args": ["/path/to/mcp-newsapi/dist/index.js"],
      "env": {
        "NEWSAPI_KEY": "your-newsapi-key"
      }
    }
  }
}
```

## Usage with npx

```bash
npx mcp-newsapi
```

## License

MIT
