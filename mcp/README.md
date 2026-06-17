# ERP MCP Server

Model Context Protocol (MCP) server for managing projects, tasks, and notes in the ERP System.

This server enables AI assistants (such as Antigravity, Claude Desktop, or Cursor) to read and modify data in your ERP workspace using your personal API key.

## Installation

Inside the `/mcp` directory, install the dependencies:

```bash
cd mcp
npm install
```

## Configuration

The server expects two environment variables:
- `ERP_API_KEY`: Your personal API key, which you can generate under **Settings** in the ERP.
- `ERP_API_URL` (optional): The API endpoint of the ERP backend. Defaults to `http://localhost:8080/api` (the port Nginx uses to expose the API).

You can create a `.env` file inside the `mcp` folder for local development:

```env
ERP_API_KEY=erp_your_personal_api_key_here
ERP_API_URL=http://localhost:8080/api
```

## Building

Compile the TypeScript codebase to JavaScript:

```bash
npm run build
```

This will output the compiled code to `dist/index.js`.

## Registering with Claude Desktop / Antigravity

Add the following config to your Claude Desktop config file (located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "erp-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/your/workspace/mcp/dist/index.js"],
      "env": {
        "ERP_API_KEY": "erp_your_personal_api_key_here",
        "ERP_API_URL": "http://localhost:8080/api"
      }
    }
  }
}
```

Replace `/absolute/path/to/your/workspace` with the actual path to this repository.

## Available Tools

The MCP server exposes the following tools to the assistant:

- `list_projects`: Queries and searches for projects.
- `create_project`: Adds a new project.
- `update_project`: Modifies project details.
- `list_tasks`: Retrieves tasks with search, priority, status, and project filters.
- `create_task`: Adds a new task to a project.
- `update_task`: Modifies task status, assignment, details, etc.
- `list_notes`: Retrieves personal notes for the API key owner.
- `create_note`: Adds a personal note.
- `update_note`: Modifies note content or title.
