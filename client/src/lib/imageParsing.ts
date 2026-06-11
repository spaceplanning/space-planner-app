// ============================================================
// SPACE PLANNER STUDIO — Image Parsing Engine
// Blueprint Dark Theme
// Uses VITE_FRONTEND_FORGE_API_KEY for AI vision parsing
// ============================================================

import { Room, generateId } from "./floorPlanTypes";

export interface ParsedFloorPlan {
  rooms: Room[];
  totalWidth: number;
  totalHeight: number;
  rawText: string;
}

export interface ParseProgress {
  stage: "uploading" | "analyzing" | "generating" | "complete" | "error";
  message: string;
  progress: number; // 0-100
}

// Convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Convert PDF page to image using canvas
async function pdfPageToBase64(file: File): Promise<string> {
  // For PDF we'll use the file as-is and let the AI handle it
  return fileToBase64(file);
}

const ROOM_COLORS_MAP: Record<string, string> = {
  BEDROOM: "#1e3a5f",
  "MASTER BEDROOM": "#1e3a5f",
  "BED ROOM": "#1e3a5f",
  LIVING: "#1a3d2e",
  "LIVING ROOM": "#1a3d2e",
  "GREAT ROOM": "#1a3d2e",
  KITCHEN: "#3d1e1e",
  BATHROOM: "#2a1e3d",
  BATH: "#2a1e3d",
  DINING: "#3d2e1a",
  "DINING ROOM": "#3d2e1a",
  OFFICE: "#1e2a3d",
  STUDY: "#1e2a3d",
  HALLWAY: "#2a2a2a",
  HALL: "#2a2a2a",
  CLOSET: "#1e1e2a",
  GARAGE: "#2a2a1e",
  LAUNDRY: "#1e2a2a",
  DEFAULT: "#1a2a3a",
};

function getRoomColor(name: string): string {
  const upper = name.toUpperCase();
  for (const key of Object.keys(ROOM_COLORS_MAP)) {
    if (upper.includes(key)) return ROOM_COLORS_MAP[key];
  }
  return ROOM_COLORS_MAP.DEFAULT;
}

export async function parseFloorPlanImage(
  file: File,
  onProgress: (p: ParseProgress) => void
): Promise<ParsedFloorPlan> {
  onProgress({ stage: "uploading", message: "Reading image file...", progress: 10 });

  let base64: string;
  try {
    if (file.type === "application/pdf") {
      base64 = await pdfPageToBase64(file);
    } else {
      base64 = await fileToBase64(file);
    }
  } catch (e) {
    throw new Error("Failed to read file. Please try again.");
  }

  onProgress({ stage: "analyzing", message: "AI scanning for rooms and dimensions...", progress: 30 });

  const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
  const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error("AI vision API not configured.");
  }

  const prompt = `You are an expert architectural floor plan analyzer. Analyze this floor plan image and extract:

1. All rooms with their names and dimensions (width x depth in feet)
2. The overall floor plan dimensions (total width x total height in feet)

Return ONLY valid JSON in this exact format, no other text:
{
  "totalWidth": <number in feet>,
  "totalHeight": <number in feet>,
  "rooms": [
    {
      "name": "<ROOM NAME in uppercase>",
      "widthFt": <number>,
      "heightFt": <number>,
      "xFt": <estimated x position from left in feet>,
      "yFt": <estimated y position from top in feet>
    }
  ]
}

Rules:
- Room names should be uppercase (e.g., "BEDROOM", "LIVING ROOM", "KITCHEN", "BATHROOM")
- All dimensions in decimal feet (e.g., 12.5 for 12'6")
- Estimate x/y positions based on the room's position in the layout
- If you cannot determine exact dimensions, make reasonable estimates based on standard room sizes
- Include ALL visible rooms, hallways, closets, bathrooms
- totalWidth and totalHeight should encompass the entire floor plan`;

  let responseText = "";
  try {
    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type === "application/pdf" ? "image/jpeg" : file.type};base64,${base64}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    responseText = data.choices?.[0]?.message?.content || "";
  } catch (e) {
    throw new Error(`Vision analysis failed: ${(e as Error).message}`);
  }

  onProgress({ stage: "generating", message: "Generating digital floor plan...", progress: 70 });

  // Parse the JSON response
  let parsed: {
    totalWidth: number;
    totalHeight: number;
    rooms: Array<{
      name: string;
      widthFt: number;
      heightFt: number;
      xFt: number;
      yFt: number;
    }>;
  };

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("Failed to parse AI response. Please try manual entry.");
  }

  // Validate and normalize
  const totalWidth = Math.max(parsed.totalWidth || 30, 10);
  const totalHeight = Math.max(parsed.totalHeight || 20, 10);

  const rooms: Room[] = (parsed.rooms || []).map((r) => ({
    id: generateId(),
    name: r.name || "ROOM",
    x: Math.max(0, r.xFt || 0),
    y: Math.max(0, r.yFt || 0),
    width: Math.max(r.widthFt || 10, 4),
    height: Math.max(r.heightFt || 8, 4),
    color: getRoomColor(r.name || ""),
  }));

  onProgress({ stage: "complete", message: "Floor plan generated successfully!", progress: 100 });

  return {
    rooms,
    totalWidth,
    totalHeight,
    rawText: responseText,
  };
}

// Generate a demo floor plan for testing without an image
export function generateDemoFloorPlan(): ParsedFloorPlan {
  const rooms: Room[] = [
    { id: generateId(), name: "LIVING ROOM", x: 0, y: 0, width: 16, height: 14, color: "#1a3d2e" },
    { id: generateId(), name: "KITCHEN", x: 16, y: 0, width: 12, height: 10, color: "#3d1e1e" },
    { id: generateId(), name: "DINING ROOM", x: 16, y: 10, width: 12, height: 8, color: "#3d2e1a" },
    { id: generateId(), name: "BEDROOM 1", x: 0, y: 14, width: 14, height: 12, color: "#1e3a5f" },
    { id: generateId(), name: "BEDROOM 2", x: 14, y: 14, width: 12, height: 12, color: "#1e3a5f" },
    { id: generateId(), name: "BATHROOM", x: 0, y: 26, width: 8, height: 8, color: "#2a1e3d" },
    { id: generateId(), name: "HALLWAY", x: 8, y: 26, width: 6, height: 8, color: "#2a2a2a" },
    { id: generateId(), name: "CLOSET", x: 14, y: 26, width: 4, height: 4, color: "#1e1e2a" },
  ];

  return {
    rooms,
    totalWidth: 28,
    totalHeight: 34,
    rawText: "Demo floor plan",
  };
}
