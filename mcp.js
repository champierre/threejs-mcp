import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

// Constants
const API_BASE = "http://localhost:3000";

// Create server instance
const server = new McpServer({
    name: "threejs-mcp-server",
    version: "1.0.0",
});

// API request function
async function makeRequest(url) {
    const headers = {
        Accept: "application/json"
    };
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making request:", error);
        return null;
    }
}
// Define tools
server.tool("get-cubes", "Get all cubes", {}, async () => {
    const url = `${API_BASE}/api/cubes`;
    const response = await makeRequest(url);
    if (!response) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to get cubes data",
                },
            ],
        };
    }
    if (response.count === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: "No results"
                },
            ],
        };
    }

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(response, null, 2),
            },
        ],
    };
});

// Server start function
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Three.js MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
