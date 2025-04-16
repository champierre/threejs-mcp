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
        color: z.union([
            z.number().describe("Color of the cube in decimal format"),
            z.object({
                r: z.number().min(0).max(255).describe("Red component (0-255)"),
                g: z.number().min(0).max(255).describe("Green component (0-255)"),
                b: z.number().min(0).max(255).describe("Blue component (0-255)")
            }).describe("Color in RGB format")
        ]).optional().describe("Color of the cube (default: random)"),
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
}, async (input) => {
    const url = `${API_BASE}/api/cubes`;
    
    console.error("Received input:", JSON.stringify(input, null, 2));
    
    // Clone the input to avoid modifying the original
    const params = input ? JSON.parse(JSON.stringify(input)) : {};
    
    // Debug the input structure
    console.error("Input structure:", JSON.stringify(input, null, 2));
    
    // Ensure color is properly set
    if (params && params.color) {
        if (typeof params.color === 'object' && 'r' in params.color) {
            const { r, g, b } = params.color;
            // Convert RGB to hex color format (0xRRGGBB)
            const hexColor = (r << 16) | (g << 8) | b;
            console.error(`Converting RGB(${r},${g},${b}) to hex: 0x${hexColor.toString(16)}`);
            params.color = hexColor;
        } else {
            console.error(`Using provided color: ${params.color}`);
        }
    }
    // Do not set a default color, let the server handle it
    
    console.error("Sending params to API:", JSON.stringify(params, null, 2));
    
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
