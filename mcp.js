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
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making request:", error);
        return null;
    }
}
// Define tools
server.tool("get-boxes", "すべての立体を取得", {}, async () => {
    const url = `${API_BASE}/api/boxes`;
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

// Add box tool
server.tool("add-box", "新しい直方体をシーンに追加", {
    width: z.number().optional().describe("Width of the box (default: 10)"),
    height: z.number().optional().describe("Height of the box (default: 10)"),
    depth: z.number().optional().describe("Depth of the box (default: 10)"),
    color: z.object({
        r: z.number().min(0).max(255).describe("Red component (0-255)"),
        g: z.number().min(0).max(255).describe("Green component (0-255)"),
        b: z.number().min(0).max(255).describe("Blue component (0-255)")
    }).optional().describe("Color(RGB format) of the box (default: random)"),
    position: z.object({
        x: z.number().describe("X position"),
        y: z.number().describe("Y position"),
        z: z.number().describe("Z position")
    }).optional().describe("Position of the box (default: random)"),
    rotation: z.object({
        x: z.number().describe("X rotation in radians"),
        y: z.number().describe("Y rotation in radians"),
        z: z.number().describe("Z rotation in radians")
    }).optional().describe("Rotation of the box (default: random)")
}, async (params) => {
    const url = `${API_BASE}/api/boxes`;
    
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
    console.error("Making request to URL:", url);
    
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
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
        }
        
        const cube = await response.json();
        
        return {
            content: [
                {
                    type: "text",
                    text: `直方体が追加されました。ID: ${cube.id}`,
                },
                {
                    type: "text",
                    text: JSON.stringify(cube, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error("Error adding box:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `直方体の追加に失敗しました: ${error.message}`,
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
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
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
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
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

// Remove box tool
server.tool("remove-box", "IDを指定して立体をシーンから削除", {
    id: z.number().describe("ID of the object to remove")
}, async (params) => {
    const url = `${API_BASE}/api/boxes/${params.id}`;
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
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

// Remove all boxes tool
server.tool("remove-all-boxes", "すべての立体をシーンから削除", {}, async () => {
    const url = `${API_BASE}/api/boxes`;
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
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

// Add pyramid tool
server.tool("add-pyramid", "新しい正n角錐をシーンに追加", {
    radius: z.number().optional().describe("Radius of the pyramid base (default: 5)"),
    height: z.number().optional().describe("Height of the pyramid (default: 10)"),
    segments: z.number().min(3).optional().describe("Number of sides of the pyramid base (min: 3, default: 4)"),
    color: z.object({
        r: z.number().min(0).max(255).describe("Red component (0-255)"),
        g: z.number().min(0).max(255).describe("Green component (0-255)"),
        b: z.number().min(0).max(255).describe("Blue component (0-255)")
    }).optional().describe("Color(RGB format) of the pyramid (default: random)"),
    position: z.object({
        x: z.number().describe("X position"),
        y: z.number().describe("Y position"),
        z: z.number().describe("Z position")
    }).optional().describe("Position of the pyramid (default: random)"),
    rotation: z.object({
        x: z.number().describe("X rotation in radians"),
        y: z.number().describe("Y rotation in radians"),
        z: z.number().describe("Z rotation in radians")
    }).optional().describe("Rotation of the pyramid (default: random)")
}, async (params) => {
    const url = `${API_BASE}/api/pyramids`;
    
    console.error("Received pyramid params:", JSON.stringify(params, null, 2));
    
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
    
    console.error("Sending pyramid params to API:", JSON.stringify(paramsClone, null, 2));
    
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
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
        }
        
        const pyramid = await response.json();
        const segmentsText = pyramid.segments ? `${pyramid.segments}角` : '';
        
        return {
            content: [
                {
                    type: "text",
                    text: `正${segmentsText}錐が追加されました。ID: ${pyramid.id}`,
                },
                {
                    type: "text",
                    text: JSON.stringify(pyramid, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error("Error adding pyramid:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `正n角錐の追加に失敗しました: ${error.message}`,
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
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
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

// Screenshot tool - takes a screenshot of the current 3D scene
server.tool("take-screenshot", "現在の3Dシーンのスクリーンショットを取得", {}, async () => {
    const url = `${API_BASE}/api/screenshot`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            return {
                content: [
                    {
                        type: "text",
                        text: `スクリーンショットが保存されました: ${result.path}`,
                    },
                ],
            };
        } else {
            throw new Error(result.error || 'スクリーンショットの取得に失敗しました');
        }
    } catch (error) {
        console.error("Error taking screenshot:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `スクリーンショットの取得に失敗しました: ${error.message}`,
                },
            ],
        };
    }
});

// Add ellipsoid tool
server.tool("add-ellipsoid", "新しい楕円体をシーンに追加", {
    radiusX: z.number().optional().describe("X軸の半径 (default: 5)"),
    radiusY: z.number().optional().describe("Y軸の半径 (default: 5)"),
    radiusZ: z.number().optional().describe("Z軸の半径 (default: 5)"),
    widthSegments: z.number().optional().describe("横方向の分割数 (default: 32)"),
    heightSegments: z.number().optional().describe("縦方向の分割数 (default: 16)"),
    color: z.object({
        r: z.number().min(0).max(255).describe("Red component (0-255)"),
        g: z.number().min(0).max(255).describe("Green component (0-255)"),
        b: z.number().min(0).max(255).describe("Blue component (0-255)")
    }).optional().describe("Color(RGB format) of the ellipsoid (default: random)"),
    position: z.object({
        x: z.number().describe("X position"),
        y: z.number().describe("Y position"),
        z: z.number().describe("Z position")
    }).optional().describe("Position of the ellipsoid (default: random)"),
    rotation: z.object({
        x: z.number().describe("X rotation in radians"),
        y: z.number().describe("Y rotation in radians"),
        z: z.number().describe("Z rotation in radians")
    }).optional().describe("Rotation of the ellipsoid (default: random)")
}, async (params) => {
    const url = `${API_BASE}/api/ellipsoids`;
    
    console.error("Received ellipsoid params:", JSON.stringify(params, null, 2));
    
    const paramsClone = params ? JSON.parse(JSON.stringify(params)) : {};
    
    if (paramsClone && paramsClone.color) {
        if (typeof paramsClone.color === 'object' && 'r' in paramsClone.color) {
            const { r, g, b } = paramsClone.color;
            const hexColor = (r << 16) | (g << 8) | b;
            console.error(`Converting RGB(${r},${g},${b}) to hex: 0x${hexColor.toString(16)}`);
            paramsClone.color = hexColor;
        }
    }
    
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
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
        }
        
        const ellipsoid = await response.json();
        
        return {
            content: [
                {
                    type: "text",
                    text: `楕円体が追加されました。ID: ${ellipsoid.id}`,
                },
                {
                    type: "text",
                    text: JSON.stringify(ellipsoid, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error("Error adding ellipsoid:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `楕円体の追加に失敗しました: ${error.message}`,
                },
            ],
        };
    }
});

// Add torus tool
server.tool("add-torus", "新しいトーラス（ドーナツ型）をシーンに追加", {
    radius: z.number().optional().describe("トーラスの半径 (default: 5)"),
    tubeRadius: z.number().optional().describe("チューブの半径 (default: 2)"),
    radialSegments: z.number().optional().describe("放射方向の分割数 (default: 8)"),
    tubularSegments: z.number().optional().describe("チューブ方向の分割数 (default: 16)"),
    color: z.object({
        r: z.number().min(0).max(255).describe("Red component (0-255)"),
        g: z.number().min(0).max(255).describe("Green component (0-255)"),
        b: z.number().min(0).max(255).describe("Blue component (0-255)")
    }).optional().describe("Color(RGB format) of the torus (default: random)"),
    position: z.object({
        x: z.number().describe("X position"),
        y: z.number().describe("Y position"),
        z: z.number().describe("Z position")
    }).optional().describe("Position of the torus (default: random)"),
    rotation: z.object({
        x: z.number().describe("X rotation in radians"),
        y: z.number().describe("Y rotation in radians"),
        z: z.number().describe("Z rotation in radians")
    }).optional().describe("Rotation of the torus (default: random)")
}, async (params) => {
    const url = `${API_BASE}/api/tori`;
    
    console.error("Received torus params:", JSON.stringify(params, null, 2));
    
    const paramsClone = params ? JSON.parse(JSON.stringify(params)) : {};
    
    if (paramsClone && paramsClone.color) {
        if (typeof paramsClone.color === 'object' && 'r' in paramsClone.color) {
            const { r, g, b } = paramsClone.color;
            const hexColor = (r << 16) | (g << 8) | b;
            console.error(`Converting RGB(${r},${g},${b}) to hex: 0x${hexColor.toString(16)}`);
            paramsClone.color = hexColor;
        }
    }
    
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
            const errorText = await response.text();
            console.error(`HTTP error details: status: ${response.status}, url: ${url}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, details: ${errorText}`);
        }
        
        const torus = await response.json();
        
        return {
            content: [
                {
                    type: "text",
                    text: `トーラスが追加されました。ID: ${torus.id}`,
                },
                {
                    type: "text",
                    text: JSON.stringify(torus, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error("Error adding torus:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `トーラスの追加に失敗しました: ${error.message}`,
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
