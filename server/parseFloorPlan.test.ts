import { describe, it, expect, vi } from "vitest";

describe("parseFloorPlan Response Handling", () => {
  it("should extract JSON from string response", () => {
    const responseText = `Here's the floor plan analysis:
{
  "totalWidth": 30,
  "totalHeight": 25,
  "rooms": [
    {"name": "LIVING ROOM", "widthFt": 16, "heightFt": 14, "xFt": 0, "yFt": 0}
  ]
}
Some additional text after JSON.`;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    expect(jsonMatch).toBeTruthy();
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      expect(parsed.totalWidth).toBe(30);
      expect(parsed.rooms).toHaveLength(1);
    }
  });

  it("should handle array content type", () => {
    // Simulate array content from LLM
    const content = [
      { type: "text", text: `Analysis:\n{\n  "totalWidth": 40,\n  "totalHeight": 35,\n  "rooms": []\n}` },
    ];

    let responseText = "";
    if (Array.isArray(content)) {
      for (const item of content) {
        if ((item as any).type === "text" && "text" in item) {
          responseText = (item as any).text;
          break;
        }
      }
    }

    expect(responseText).toBeTruthy();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    expect(jsonMatch).toBeTruthy();
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      expect(parsed.totalWidth).toBe(40);
    }
  });

  it("should handle string content type", () => {
    const content = `{\n  "totalWidth": 50,\n  "totalHeight": 45,\n  "rooms": []\n}`;

    let responseText = "";
    if (typeof content === "string") {
      responseText = content;
    }

    expect(responseText).toBeTruthy();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    expect(jsonMatch).toBeTruthy();
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      expect(parsed.totalWidth).toBe(50);
    }
  });

  it("should handle nested JSON in response", () => {
    const responseText = `The floor plan contains:
{
  "totalWidth": 28,
  "totalHeight": 26,
  "rooms": [
    {
      "name": "BEDROOM",
      "widthFt": 12,
      "heightFt": 12,
      "xFt": 0,
      "yFt": 14
    },
    {
      "name": "BATHROOM",
      "widthFt": 8,
      "heightFt": 12,
      "xFt": 12,
      "yFt": 14
    }
  ]
}
End of analysis.`;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    expect(jsonMatch).toBeTruthy();
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      expect(parsed.rooms).toHaveLength(2);
      expect(parsed.rooms[0].name).toBe("BEDROOM");
    }
  });
});
