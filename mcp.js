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

// Add cube tool
server.tool("add-cube", "Add a new cube to the scene", {
    input: z.object({
        size: z.number().optional().describe("Size of the cube (default: 10)"),
        color: z.number().optional().describe("Color of the cube in decimal format (default: random)"),
        position: z.object({
            x: z.number().describe("X position"),
            y: z.number().describe("Y position"),
            z: z.number().describe("Z position")
        }).optional().describe("Position of the cube (default: random)"),
        rotation: z.object({
            x: z.number().describe("X rotation in radians"),
            y: z.number().describe("Y rotation in radians"),
            z: z.number().describe("Z rotation in radians")
        }).optional().describe("Rotation of the cube (default: random)")
    }).optional(),
}, async (params) => {
    const url = `${API_BASE}/api/cubes`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(params || {})
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const cube = await response.json();
        
        return {
            content: [
                {
                    type: "text",
                    text: `Cube added successfully. ID: ${cube.id}`,
                },
                {
                    type: "text",
                    text: JSON.stringify(cube, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error("Error adding cube:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to add cube: ${error.message}`,
                },
            ],
        };
    }
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
