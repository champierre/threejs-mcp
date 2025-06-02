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
server.tool("get-cubes", "すべての立体を取得", {}, async () => {
    const url = `${API_BASE}/api/cubes`;
    const response = await makeRequest(url);
    if (!response) {
        return {
            content: [
                {
                    type: "text",
                    text: "立体データの取得に失敗しました",
                },
            ],
        };
    }
    if (response.count === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: "結果がありません"
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
server.tool("add-cube", "新しい立方体をシーンに追加", {
    size: z.number().optional().describe("Size of the cube (default: 10)"),
    color: z.object({
        r: z.number().min(0).max(255).describe("Red component (0-255)"),
        g: z.number().min(0).max(255).describe("Green component (0-255)"),
        b: z.number().min(0).max(255).describe("Blue component (0-255)")
    }).optional().describe("Color(RGB format) of the cube (default: random)"),
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
}, async (params) => {
    const url = `${API_BASE}/api/cubes`;
    
    console.error("Received params:", JSON.stringify(params, null, 2));
    
    // Clone the params to avoid modifying the original
    const paramsClone = params ? JSON.parse(JSON.stringify(params)) : {};
    
    // Debug the params structure
    console.error("Params structure:", JSON.stringify(params, null, 2));
    
    // Ensure color is properly set
    if (paramsClone && paramsClone.color) {
        if (typeof paramsClone.color === 'object' && 'r' in paramsClone.color) {
            const { r, g, b } = paramsClone.color;
            // Convert RGB to hex color format (0xRRGGBB)
            const hexColor = (r << 16) | (g << 8) | b;
            console.error(`Converting RGB(${r},${g},${b}) to hex: 0x${hexColor.toString(16)}`);
            paramsClone.color = hexColor;
        } else {
            console.error(`Using provided color: ${paramsClone.color}`);
        }
    }
    // Do not set a default color, let the server handle it
    
    console.error("Sending params to API:", JSON.stringify(paramsClone, null, 2));
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(paramsClone || {})
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const cube = await response.json();
        
        return {
            content: [
                {
                    type: "text",
                    text: `立方体が追加されました。ID: ${cube.id}`,
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
                    text: `立方体の追加に失敗しました: ${error.message}`,
                },
            ],
        };
    }
});

// Add regular prism tool
server.tool("add-prism", "新しい正n角柱をシーンに追加", {
    radius: z.number().optional().describe("Radius of the prism base (default: 5)"),
    height: z.number().optional().describe("Height of the prism (default: 10)"),
    segments: z.number().min(3).optional().describe("Number of sides of the prism base (min: 3, default: 6)"),
    color: z.object({
        r: z.number().min(0).max(255).describe("Red component (0-255)"),
        g: z.number().min(0).max(255).describe("Green component (0-255)"),
        b: z.number().min(0).max(255).describe("Blue component (0-255)")
    }).optional().describe("Color(RGB format) of the prism (default: random)"),
    position: z.object({
        x: z.number().describe("X position"),
        y: z.number().describe("Y position"),
        z: z.number().describe("Z position")
    }).optional().describe("Position of the prism (default: random)"),
    rotation: z.object({
        x: z.number().describe("X rotation in radians"),
        y: z.number().describe("Y rotation in radians"),
        z: z.number().describe("Z rotation in radians")
    }).optional().describe("Rotation of the prism (default: random)")
}, async (params) => {
    const url = `${API_BASE}/api/prisms`;
    
    console.error("Received prism params:", JSON.stringify(params, null, 2));
    
    // Clone the params to avoid modifying the original
    const paramsClone = params ? JSON.parse(JSON.stringify(params)) : {};
    
    // Ensure color is properly set
    if (paramsClone && paramsClone.color) {
        if (typeof paramsClone.color === 'object' && 'r' in paramsClone.color) {
            const { r, g, b } = paramsClone.color;
            // Convert RGB to hex color format (0xRRGGBB)
            const hexColor = (r << 16) | (g << 8) | b;
            console.error(`Converting RGB(${r},${g},${b}) to hex: 0x${hexColor.toString(16)}`);
            paramsClone.color = hexColor;
        } else {
            console.error(`Using provided color: ${paramsClone.color}`);
        }
    }
    
    console.error("Sending prism params to API:", JSON.stringify(paramsClone, null, 2));
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(paramsClone || {})
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const prism = await response.json();
        const segmentsText = prism.segments ? `${prism.segments}角` : '';
        
        return {
            content: [
                {
                    type: "text",
                    text: `正${segmentsText}柱が追加されました。ID: ${prism.id}`,
                },
                {
                    type: "text",
                    text: JSON.stringify(prism, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error("Error adding prism:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `正n角柱の追加に失敗しました: ${error.message}`,
                },
            ],
        };
    }
});

// Add sphere tool
server.tool("add-sphere", "新しい球体をシーンに追加", {
    radius: z.number().optional().describe("Radius of the sphere (default: 5)"),
    widthSegments: z.number().optional().describe("Number of horizontal segments (default: 32)"),
    heightSegments: z.number().optional().describe("Number of vertical segments (default: 16)"),
    color: z.object({
        r: z.number().min(0).max(255).describe("Red component (0-255)"),
        g: z.number().min(0).max(255).describe("Green component (0-255)"),
        b: z.number().min(0).max(255).describe("Blue component (0-255)")
    }).optional().describe("Color(RGB format) of the sphere (default: random)"),
    position: z.object({
        x: z.number().describe("X position"),
        y: z.number().describe("Y position"),
        z: z.number().describe("Z position")
    }).optional().describe("Position of the sphere (default: random)"),
    rotation: z.object({
        x: z.number().describe("X rotation in radians"),
        y: z.number().describe("Y rotation in radians"),
        z: z.number().describe("Z rotation in radians")
    }).optional().describe("Rotation of the sphere (default: random)")
}, async (params) => {
    const url = `${API_BASE}/api/spheres`;
    
    console.error("Received sphere params:", JSON.stringify(params, null, 2));
    
    // Clone the params to avoid modifying the original
    const paramsClone = params ? JSON.parse(JSON.stringify(params)) : {};
    
    // Ensure color is properly set
    if (paramsClone && paramsClone.color) {
        if (typeof paramsClone.color === 'object' && 'r' in paramsClone.color) {
            const { r, g, b } = paramsClone.color;
            // Convert RGB to hex color format (0xRRGGBB)
            const hexColor = (r << 16) | (g << 8) | b;
            console.error(`Converting RGB(${r},${g},${b}) to hex: 0x${hexColor.toString(16)}`);
            paramsClone.color = hexColor;
        } else {
            console.error(`Using provided color: ${paramsClone.color}`);
        }
    }
    
    console.error("Sending sphere params to API:", JSON.stringify(paramsClone, null, 2));
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(paramsClone || {})
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const sphere = await response.json();
        
        return {
            content: [
                {
                    type: "text",
                    text: `球体が追加されました。ID: ${sphere.id}`,
                },
                {
                    type: "text",
                    text: JSON.stringify(sphere, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error("Error adding sphere:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `球体の追加に失敗しました: ${error.message}`,
                },
            ],
        };
    }
});

// Remove cube tool
server.tool("remove-cube", "IDを指定して立体をシーンから削除", {
    id: z.number().describe("ID of the object to remove")
}, async (params) => {
    const url = `${API_BASE}/api/cubes/${params.id}`;
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        return {
            content: [
                {
                    type: "text",
                    text: `立体が削除されました。ID: ${params.id}`,
                },
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error("Error removing cube:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `立体の削除に失敗しました: ${error.message}`,
                },
            ],
        };
    }
});

// Remove all cubes tool
server.tool("remove-all-cubes", "すべての立体をシーンから削除", {}, async () => {
    const url = `${API_BASE}/api/cubes`;
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        return {
            content: [
                {
                    type: "text",
                    text: "すべての立体が削除されました。",
                },
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error("Error removing all cubes:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `すべての立体の削除に失敗しました: ${error.message}`,
                },
            ],
        };
    }
});

// Subtract tool - performs boolean subtraction on two objects
server.tool("subtract-objects", "2つの立体を減算処理（くり抜き）する", {
    targetId: z.number().describe("ID of the target object to be subtracted from"),
    subtractId: z.number().describe("ID of the object to subtract with")
}, async (params) => {
    const url = `${API_BASE}/api/subtract`;
    
    console.error("Received subtract params:", JSON.stringify(params, null, 2));
    
    // Convert parameter names to match server API
    const apiParams = {
        fromId: params.targetId,
        subtractId: params.subtractId
    };
    
    console.error("Sending params to API:", JSON.stringify(apiParams, null, 2));
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(apiParams)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        return {
            content: [
                {
                    type: "text",
                    text: `減算処理が完了しました。対象ID: ${params.targetId}, 減算ID: ${params.subtractId}`,
                },
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error("Error subtracting objects:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `減算処理に失敗しました: ${error.message}`,
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
