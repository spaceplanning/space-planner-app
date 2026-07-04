import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { nanoid } from "nanoid";
import { convertPdfToImage } from "./pdfToImage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Floor Plans procedures
  floorPlans: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserFloorPlans(ctx.user.id)
    ),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(({ ctx, input }) =>
        db.getFloorPlanById(input.id, ctx.user.id)
      ),

    save: protectedProcedure
      .input(z.object({
        id: z.string().optional(),
        name: z.string(),
        totalWidth: z.number(),
        totalHeight: z.number(),
        roomsJson: z.string(),
        furnitureJson: z.string(),
      }))
      .mutation(({ ctx, input }) =>
        db.saveFloorPlan({
          id: input.id || nanoid(),
          userId: ctx.user.id,
          name: input.name,
          totalWidth: input.totalWidth,
          totalHeight: input.totalHeight,
          roomsJson: input.roomsJson,
          furnitureJson: input.furnitureJson,
        })
      ),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        db.deleteFloorPlan(input.id, ctx.user.id)
      ),
  }),

  // Custom Furniture procedures
  customFurniture: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserCustomFurniture(ctx.user.id)
    ),

    save: protectedProcedure
      .input(z.object({
        id: z.string().optional(),
        name: z.string(),
        category: z.string(),
        width: z.number(),
        depth: z.number(),
        color: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.saveCustomFurniture({
          id: input.id || nanoid(),
          userId: ctx.user.id,
          name: input.name,
          category: input.category,
          width: input.width,
          depth: input.depth,
          color: input.color || "#4a9eff",
        })
      ),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        db.deleteCustomFurniture(input.id, ctx.user.id)
      ),
  }),

  // Floor Plan Sharing procedures
  sharing: router({
    createShare: protectedProcedure
      .input(z.object({
        floorPlanId: z.string(),
        permission: z.enum(["view", "edit"]),
        expiresInDays: z.number().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const shareToken = nanoid(32);
        const expiresAt = input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
          : undefined;
        
        return db.createShare({
          id: nanoid(),
          floorPlanId: input.floorPlanId,
          ownerId: ctx.user.id,
          sharedWithUserId: undefined,
          shareToken,
          permission: input.permission,
          expiresAt,
        });
      }),

    getShares: protectedProcedure
      .input(z.object({ floorPlanId: z.string() }))
      .query(({ ctx, input }) =>
        db.getFloorPlanShares(input.floorPlanId, ctx.user.id)
      ),

    deleteShare: protectedProcedure
      .input(z.object({ shareId: z.string() }))
      .mutation(({ ctx, input }) =>
        db.deleteShare(input.shareId, ctx.user.id)
      ),

    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(({ input }) =>
        db.getShareByToken(input.token)
      ),
  }),

  // Floor plan image parsing via vision AI
  parseFloorPlan: protectedProcedure
    .input(z.object({
      base64: z.string(),
      fileType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      
      // Convert PDF to image if needed
      let imageBase64 = input.base64;
      let imageType = input.fileType;
      
      if (input.fileType === "application/pdf") {
        console.error("[parseFloorPlan] Converting PDF to PNG...");
        try {
          imageBase64 = await convertPdfToImage(input.base64);
          imageType = "image/png";
          console.error("[parseFloorPlan] PDF conversion successful");
        } catch (e) {
          console.error("[parseFloorPlan] PDF conversion error:", (e as Error).message);
          throw new Error(`PDF conversion failed: ${(e as Error).message}`);
        }
      }

      const prompt = `You are an expert architectural floor plan analyzer with OCR capabilities. Analyze this floor plan image and extract the COMPLETE WIREFRAME that exactly matches the uploaded document.

Extract:
1. COMPLETE WIREFRAME: Every wall, partition, and boundary line in the floor plan
2. Use OCR to find the total square footage text anywhere on the plan
3. Identify and label each enclosed space with its room type
4. Preserve TRUE MEASUREMENTS from the floor plan document

Return ONLY valid JSON in this exact format, no other text:
{
  "totalWidth": <number in feet>,
  "totalHeight": <number in feet>,
  "totalSquareFeet": <number or null if not found>,
  "wireframe": [
    {"x": <x coordinate in feet>, "y": <y coordinate in feet>},
    {"x": <x coordinate in feet>, "y": <y coordinate in feet>},
    ...
  ],
  "sections": [
    {
      "id": "section_1",
      "name": "<ROOM TYPE: BEDROOM, KITCHEN, BATHROOM, LIVING ROOM, HALLWAY, CLOSET, LAUNDRY, ENTRY, etc.>",
      "boundary": [
        {"x": <x coordinate in feet>, "y": <y coordinate in feet>},
        {"x": <x coordinate in feet>, "y": <y coordinate in feet>},
        ...
      ],
      "squareFeet": <calculated or measured square footage of this section>
    }
  ]
}

Rules:
- WIREFRAME: Trace the COMPLETE outer boundary and ALL internal walls/partitions. Start at top-left, go clockwise around perimeter, then trace each internal wall segment.
- SECTIONS: Each enclosed space (room) gets a boundary polygon. Provide coordinates in clockwise order starting from top-left of that section.
- All coordinates in decimal feet (e.g., 12.5 for 12'6")
- Room names should be uppercase and descriptive (MASTER BEDROOM, GUEST BEDROOM, KITCHEN, DINING ROOM, etc.)
- totalWidth and totalHeight should match the actual floor plan dimensions
- Use OCR to read ALL text including room labels, dimensions, and total square footage
- If you find square footage, verify totalWidth x totalHeight approximately equals it
- ACCURACY IS CRITICAL: The wireframe must exactly match the uploaded floor plan image`;

      try {
        const response = await invokeLLM({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${imageType};base64,${imageBase64}`,
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
        });

        const content = response.choices?.[0]?.message?.content;
        let responseText = "";
        
        // Handle both string and array content types
        if (typeof content === "string") {
          responseText = content;
        } else if (Array.isArray(content)) {
          // Extract text from content array
          for (const item of content) {
            if ((item as any).type === "text" && "text" in item) {
              responseText = (item as any).text;
              break;
            }
          }
        }

        if (!responseText) throw new Error("No text content in response");
        
        console.error("[parseFloorPlan] Response text length:", responseText.length);
        console.error("[parseFloorPlan] Response first 500 chars:", responseText.substring(0, 500));
        console.error("[parseFloorPlan] Response finish_reason:", response.choices?.[0]?.finish_reason);
        console.error("[parseFloorPlan] Response usage:", response.usage);

        // Try to extract JSON with multiple strategies
        let parsed = null;
        
        // Strategy 1: Look for JSON object
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error("[parseFloorPlan] JSON parse failed for match:", jsonMatch[0].substring(0, 100));
          }
        }
        
        if (!parsed) {
          // Strategy 2: Try to find JSON array and convert
          const arrayMatch = responseText.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            try {
              const arr = JSON.parse(arrayMatch[0]);
              if (Array.isArray(arr) && arr.length > 0) {
                parsed = arr[0];
              }
            } catch (e) {
              console.error("[parseFloorPlan] JSON array parse failed");
            }
          }
        }
        
        if (!parsed) {
          console.error("[parseFloorPlan] Response text:", responseText.substring(0, 500));
          throw new Error("No valid JSON found in response");
        }
        
        // Validate that rooms fit within the square footage dimensions
        if (parsed.totalSquareFeet && parsed.totalSquareFeet > 0) {
          const calculatedArea = parsed.totalWidth * parsed.totalHeight;
          const squareFeetArea = parsed.totalSquareFeet;
          const tolerance = 0.2; // Allow 20% difference
          
          if (Math.abs(calculatedArea - squareFeetArea) / squareFeetArea > tolerance) {
            console.warn(
              `[parseFloorPlan] Area mismatch: calculated=${calculatedArea.toFixed(0)} sqft, ` +
              `extracted=${squareFeetArea.toFixed(0)} sqft. Adjusting dimensions to match extracted sqft.`
            );
            
            // Recalculate dimensions to match the extracted square footage
            // Assume a reasonable aspect ratio (e.g., 1.5:1 for typical floor plans)
            const aspectRatio = 1.5;
            const newHeight = Math.sqrt(squareFeetArea / aspectRatio);
            const newWidth = newHeight * aspectRatio;
            
            parsed.totalWidth = Math.round(newWidth * 10) / 10;
            parsed.totalHeight = Math.round(newHeight * 10) / 10;
            
            console.error(
              `[parseFloorPlan] Adjusted dimensions: width=${parsed.totalWidth}ft, height=${parsed.totalHeight}ft`
            );
          }
        }
        
        // Validate wireframe format
        if (parsed.wireframe && Array.isArray(parsed.wireframe)) {
          console.error(`[parseFloorPlan] Wireframe extracted: ${parsed.wireframe.length} points`);
          
          // Validate wireframe points are within bounds
          for (const point of parsed.wireframe) {
            if (point.x < 0 || point.y < 0 || point.x > parsed.totalWidth || point.y > parsed.totalHeight) {
              console.warn(
                `[parseFloorPlan] Wireframe point (${point.x}, ${point.y}) outside bounds (0,0) to (${parsed.totalWidth}, ${parsed.totalHeight})`
              );
            }
          }
        }
        
        // Validate sections format
        if (parsed.sections && Array.isArray(parsed.sections)) {
          console.error(`[parseFloorPlan] Sections extracted: ${parsed.sections.length}`);
          
          for (const section of parsed.sections) {
            console.error(`[parseFloorPlan] Section: ${section.id} - ${section.name} (${section.squareFeet} sqft)`);
            
            if (section.boundary && Array.isArray(section.boundary)) {
              for (const point of section.boundary) {
                if (point.x < 0 || point.y < 0 || point.x > parsed.totalWidth || point.y > parsed.totalHeight) {
                  console.warn(
                    `[parseFloorPlan] Section "${section.name}" point (${point.x}, ${point.y}) outside bounds`
                  );
                }
              }
            }
          }
        }
        
        // Validate that all rooms fit within the boundaries
        if (parsed.rooms && Array.isArray(parsed.rooms)) {
          for (const room of parsed.rooms) {
            const roomRight = room.xFt + room.widthFt;
            const roomBottom = room.yFt + room.heightFt;
            
            if (roomRight > parsed.totalWidth || roomBottom > parsed.totalHeight) {
              console.warn(
                `[parseFloorPlan] Room "${room.name}" extends beyond boundaries. ` +
                `Room: (${room.xFt}, ${room.yFt}) to (${roomRight}, ${roomBottom}), ` +
                `Boundaries: (0, 0) to (${parsed.totalWidth}, ${parsed.totalHeight})`
              );
            }
          }
        }
        
        return parsed;
      } catch (error) {
        const errorMsg = (error as Error).message;
        console.error("[parseFloorPlan] Error:", errorMsg);
        throw new Error(`Vision analysis failed: ${errorMsg}`);
      }
    }),
});

export type AppRouter = typeof appRouter;
