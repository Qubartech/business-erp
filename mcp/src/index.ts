import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.ERP_API_URL || "http://localhost:8080/api";
const API_KEY = process.env.ERP_API_KEY;

if (!API_KEY) {
  console.error("Warning: ERP_API_KEY environment variable is not set. API calls will fail.");
}

const server = new Server(
  {
    name: "erp-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

async function callApi(path: string, method: string = "GET", body?: any) {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    "x-api-key": API_KEY || "",
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = (await response.json()) as any;
        if (errorJson && errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMessage);
    }

    const resJson = (await response.json()) as any;
    if (resJson && resJson.success === false) {
      throw new Error(resJson.message || "Request failed");
    }
    return resJson.data;
  } catch (e: any) {
    throw new Error(`Failed to connect to ERP API: ${e.message}`);
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_projects",
        description: "List projects in the ERP. Returns projects matching filter criteria.",
        inputSchema: {
          type: "object",
          properties: {
            search: { type: "string", description: "Search query for project name or description" },
            status: { type: "string", enum: ["draft", "active", "on_hold", "completed", "archived"] },
            category: { type: "string", enum: ["client", "non_client"] },
            page: { type: "number", minimum: 1 },
            pageSize: { type: "number", minimum: 1, maximum: 100 }
          }
        }
      },
      {
        name: "create_project",
        description: "Create a new project in the ERP.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Project name (1-160 chars)" },
            description: { type: "string", description: "Optional project description" },
            status: { type: "string", enum: ["draft", "active", "on_hold", "completed", "archived"], default: "draft" },
            category: { type: "string", enum: ["client", "non_client"], default: "client" },
            startDate: { type: "string", description: "Start date in ISO format" },
            endDate: { type: "string", description: "End date in ISO format" },
            githubRepo: { type: "string", description: "GitHub repository URL or path" }
          },
          required: ["name"]
        }
      },
      {
        name: "update_project",
        description: "Update an existing project's details.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "UUID of the project to update" },
            name: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["draft", "active", "on_hold", "completed", "archived"] },
            category: { type: "string", enum: ["client", "non_client"] },
            startDate: { type: "string" },
            endDate: { type: "string" },
            githubRepo: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "list_tasks",
        description: "List tasks. Can filter by project, status, priority, and assignee.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Filter by project UUID" },
            status: { type: "string", enum: ["todo", "in_progress", "review", "done"] },
            priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
            assignedTo: { type: "string", description: "Filter by assignee UUID" },
            search: { type: "string", description: "Search query for task title" },
            page: { type: "number", minimum: 1 },
            pageSize: { type: "number", minimum: 1, maximum: 100 }
          }
        }
      },
      {
        name: "create_task",
        description: "Create a new task in the ERP.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "UUID of the project this task belongs to" },
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "Optional task description" },
            status: { type: "string", enum: ["todo", "in_progress", "review", "done"], default: "todo" },
            priority: { type: "string", enum: ["low", "medium", "high", "critical"], default: "medium" },
            assignedTo: { type: "string", description: "UUID of the assigned user" },
            dueDate: { type: "string", description: "Due date in ISO format" }
          },
          required: ["projectId", "title"]
        }
      },
      {
        name: "update_task",
        description: "Update an existing task.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "UUID of the task to update" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["todo", "in_progress", "review", "done"] },
            priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
            assignedTo: { type: "string", description: "UUID of the assigned user" },
            dueDate: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "list_notes",
        description: "List personal notes for the authenticated user.",
        inputSchema: {
          type: "object",
          properties: {
            search: { type: "string", description: "Search query for note title or content" },
            page: { type: "number", minimum: 1 },
            pageSize: { type: "number", minimum: 1, maximum: 100 }
          }
        }
      },
      {
        name: "create_note",
        description: "Create a new personal note.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Note title" },
            content: { type: "string", description: "Note content" }
          },
          required: ["title", "content"]
        }
      },
      {
        name: "update_note",
        description: "Update an existing personal note.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "UUID of the note to update" },
            title: { type: "string" },
            content: { type: "string" }
          },
          required: ["id"]
        }
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!API_KEY) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      "ERP_API_KEY environment variable is missing. Please set it to call ERP tools."
    );
  }

  try {
    switch (name) {
      // Projects
      case "list_projects": {
        const queryParams = new URLSearchParams();
        if (args) {
          Object.entries(args).forEach(([k, v]) => {
            if (v !== undefined) queryParams.append(k, String(v));
          });
        }
        const data = await callApi(`/projects?${queryParams.toString()}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "create_project": {
        const data = await callApi("/projects", "POST", args);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "update_project": {
        const { id, ...body } = args as any;
        const data = await callApi(`/projects/${id}`, "PATCH", body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      // Tasks
      case "list_tasks": {
        const queryParams = new URLSearchParams();
        if (args) {
          Object.entries(args).forEach(([k, v]) => {
            if (v !== undefined) queryParams.append(k, String(v));
          });
        }
        const data = await callApi(`/tasks?${queryParams.toString()}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "create_task": {
        const data = await callApi("/tasks", "POST", args);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "update_task": {
        const { id, ...body } = args as any;
        const data = await callApi(`/tasks/${id}`, "PATCH", body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      // Notes
      case "list_notes": {
        const queryParams = new URLSearchParams();
        if (args) {
          Object.entries(args).forEach(([k, v]) => {
            if (v !== undefined) queryParams.append(k, String(v));
          });
        }
        const data = await callApi(`/notes?${queryParams.toString()}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "create_note": {
        const data = await callApi("/notes", "POST", args);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "update_note": {
        const { id, ...body } = args as any;
        const data = await callApi(`/notes/${id}`, "PATCH", body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${error.message}` }],
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ERP MCP Server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
