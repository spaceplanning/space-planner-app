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
        
        return parsed;
      } catch (error) {
        const errorMsg = (error as Error).message;
        console.error("[parseFloorPlan] Error:", errorMsg);
        throw new Error(`Vision analysis failed: ${errorMsg}`);
      }
    }),
});

export type AppRouter = typeof appRouter;
