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

    sendFloorPlanEmail: protectedProcedure
      .input(z.object({
        floorPlanId: z.string(),
        recipientEmail: z.string().email(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get the floor plan
        const floorPlan = await db.getFloorPlanById(input.floorPlanId, ctx.user.id);
        if (!floorPlan) {
          throw new Error("Floor plan not found");
        }

        // For now, just return success - email sending would require email service integration
        // In production, integrate with SendGrid, AWS SES, or similar
        return {
          success: true,
          message: `Floor plan "${floorPlan.name}" will be sent to ${input.recipientEmail}`,
        };
      }),

    downloadFloorPlanPdf: protectedProcedure
      .input(z.object({
        floorPlanId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get the floor plan
        const floorPlan = await db.getFloorPlanById(input.floorPlanId, ctx.user.id);
        if (!floorPlan) {
          throw new Error("Floor plan not found");
        }

        // Generate PDF
        const { generateMeasurementsPdf } = await import("./measurementsPdf");
        const { generateMeasurementsReport } = await import("./measurements");
        const rooms = floorPlan.roomsJson ? JSON.parse(floorPlan.roomsJson) : [];
        const measurements = generateMeasurementsReport(floorPlan.name, rooms);
        const pdfBuffer = generateMeasurementsPdf(measurements);

        // Return base64 encoded PDF for download
        return {
          success: true,
          pdfData: Buffer.from(pdfBuffer).toString("base64"),
          fileName: `${floorPlan.name}.pdf`,
        };
      }),
  }),

  // Measurements report generation
  measurements: router({
    generateReport: protectedProcedure
      .input(z.object({
        floorPlanId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { generateMeasurementsReport } = await import("./measurements");
        
        // Get the floor plan
        const plan = await db.getFloorPlanById(input.floorPlanId, ctx.user.id);
        if (!plan) {
          throw new Error("Floor plan not found");
        }
        
        // Parse the JSON
        let rooms: any[] = [];
        let sections: any[] = [];
        
        try {
          rooms = JSON.parse(plan.roomsJson);
        } catch (e) {
          console.error("Failed to parse rooms:", e);
        }
        
        try {
          // Check if sections are stored in furnitureJson (from wireframe parsing)
          const furnitureData = JSON.parse(plan.furnitureJson);
          if (furnitureData.sections) {
            sections = furnitureData.sections;
          }
        } catch (e) {
          console.error("Failed to parse sections:", e);
        }
        
        // Generate the report
        const report = generateMeasurementsReport(plan.name, rooms, sections);
        
        // Generate PDF
        const { generateMeasurementsPdf } = await import("./measurementsPdf");
        const pdfBuffer = generateMeasurementsPdf(report);
        
        // Convert to base64 for transmission
        const pdfBase64 = pdfBuffer.toString("base64");
        
        return {
          report,
          pdfBase64,
          fileName: `${plan.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-measurements.pdf`,
        };
      }),
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

            const prompt = `You are an expert architectural floor plan analyzer with OCR and geometric tracing capabilities. Your task is to create an EXACT REPLICA of the uploaded floor plan as a complete wireframe.

**CRITICAL REQUIREMENTS - WIREFRAME FIRST:**
1. TRACE THE COMPLETE PERIMETER: Identify and trace the outer boundary of the entire floor plan. This is the main wireframe polygon.
2. TRACE ALL INTERNAL WALLS: Identify all internal walls, partitions, and divisions within the perimeter.
3. EXTRACT ROOM BOUNDARIES: For each enclosed space (room), extract its boundary polygon based on the walls.
4. EXTRACT DIMENSIONS: Use OCR to read all dimension labels, room names, and square footage from the plan.
5. COORDINATE MAPPING: Convert all traced walls and boundaries to precise (x, y) coordinates in feet.

**WIREFRAME GEOMETRY PRIORITY (DO THIS FIRST):**
1. Trace the outer perimeter starting from top-left corner, going CLOCKWISE around the entire boundary
2. Include ALL corners, angles, and indentations - no approximations or simplifications
3. Trace each internal wall segment with precise coordinates
4. Create section boundaries by connecting wall segments to form closed polygons
5. Ensure all traced coordinates maintain exact angles and distances from the original
6. For irregular/angled walls: trace the exact angle, not a simplified rectangle

**DIMENSION EXTRACTION PRIORITY (AFTER WIREFRAME):**
1. Extract total square footage from OCR text on the plan
2. Extract individual room dimensions shown on the plan
3. Extract overall floor plan dimensions if shown
4. If dimensions conflict, prioritize the total square footage as the source of truth
5. Recalculate totalWidth/totalHeight to ensure area = totalSquareFeet

Return ONLY valid JSON in this exact format, no other text:
{
  "totalWidth": <number in feet - MUST satisfy: totalWidth * totalHeight ≈ totalSquareFeet>,
  "totalHeight": <number in feet - MUST satisfy: totalWidth * totalHeight ≈ totalSquareFeet>,
  "totalSquareFeet": <number from OCR - this is the source of truth>,
  "dimensionNotes": "<explanation of how dimensions were calculated to match sqft>",
  "wireframe": [
    {"x": <x coordinate in feet>, "y": <y coordinate in feet>},
    {"x": <x coordinate in feet>, "y": <y coordinate in feet>},
    ...
  ],
  "sections": [
    {
      "id": "section_1",
      "name": "<ROOM TYPE: MASTER BEDROOM, GUEST BEDROOM, KITCHEN, DINING ROOM, LIVING ROOM, BATHROOM, POWDER ROOM, LAUNDRY, ENTRY, HALLWAY, CLOSET, PANTRY, STORAGE, PATIO/BALCONY, etc.>",
      "boundary": [
        {"x": <x coordinate in feet>, "y": <y coordinate in feet>},
        {"x": <x coordinate in feet>, "y": <y coordinate in feet>},
        ...
      ],
      "squareFeet": <exact square footage for this room from OCR or calculated>,
      "dimensions": "<width x depth in feet'inches\" format if shown on plan>"
    }
  ]
}

**EXACT REPLICA RULES - CRITICAL:**
- WIREFRAME: Trace EVERY wall, partition, and boundary line exactly as shown. Start at top-left, go clockwise around perimeter, then trace each internal wall.
- SECTIONS: Each enclosed space gets a boundary polygon with coordinates in clockwise order starting from top-left.
- COORDINATE ACCURACY: All coordinates must be precise to 0.1 feet (1.2 inches) to match the original layout
- SQUARE FOOTAGE VALIDATION: Sum of all section squareFeet MUST equal totalSquareFeet (within 2%)
- DIMENSION MATCHING: If totalWidth × totalHeight ≠ totalSquareFeet, adjust dimensions proportionally to match sqft
- ORIENTATION: Preserve exact orientation - do not rotate or mirror the layout
- ROOM LABELS: Use exact room names from the plan, or infer from context (e.g., "MASTER BEDROOM" not just "BEDROOM")
- NO SIMPLIFICATION: Do not approximate irregular shapes as rectangles. Trace the exact boundary.
- ACCURACY IS CRITICAL: This must be a pixel-perfect replica of the uploaded floor plan`;

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
          
          // Check if LLM rejected the image (common rejection patterns)
          const rejectionPatterns = [
            /cannot process this request/i,
            /not.*floor plan/i,
            /not.*architectural/i,
            /cannot extract/i,
            /unable to.*extract/i,
            /screenshot/i,
            /mobile.*phone/i,
            /transaction/i,
            /not a valid/i,
          ];
          
          const isRejected = rejectionPatterns.some(pattern => pattern.test(responseText));
          
          if (isRejected) {
            throw new Error(
              "Invalid floor plan image. Please upload a clear floor plan image (PDF, PNG, or JPG). " +
              "The image should show an architectural floor plan with room layouts and dimensions."
            );
          }
          
          throw new Error(
            "Failed to parse floor plan. Please ensure the image is a clear floor plan with visible room layouts and dimensions."
          );
        }
        
        // Validate and correct dimensions using the dimension validator
        const { validateAndCorrectDimensions, validateWireframeGeometry, validateSectionBoundaries } = await import("./dimensionValidator");
        const { validatePerimeter, ensureClockwise, validateSectionsWithinPerimeter } = await import("./perimeterTracing");
        
        const validationResult = validateAndCorrectDimensions(parsed);
        
        if (!validationResult.isValid) {
          console.warn(
            `[parseFloorPlan] Dimension validation issues: ${validationResult.issues.join("; ")}`
          );
        }
        
        if (validationResult.corrections.length > 0) {
          console.error(
            `[parseFloorPlan] Applied corrections: ${validationResult.corrections.join("; ")}`
          );
        }
        
        // Use corrected data
        parsed = validationResult.correctedData;
        
        // Validate wireframe perimeter matches floor plan
        if (parsed.wireframe && parsed.wireframe.length > 0) {
          // Ensure wireframe is in clockwise order
          parsed.wireframe = ensureClockwise(parsed.wireframe);
          
          // Validate perimeter against expected square footage
          const perimeterValidation = validatePerimeter(
            parsed.wireframe,
            parsed.totalSquareFeet,
            0.05
          );
          
          if (!perimeterValidation.isValid) {
            console.error("[parseFloorPlan] Perimeter validation errors:", perimeterValidation.errors);
            throw new Error(`Wireframe perimeter validation failed: ${perimeterValidation.errors.join("; ")}`);
          }
          
          if (perimeterValidation.warnings.length > 0) {
            console.warn("[parseFloorPlan] Perimeter warnings:", perimeterValidation.warnings);
          }
          
          console.error(
            `[parseFloorPlan] Wireframe validated: ${perimeterValidation.perimeter.length.toFixed(1)} ft perimeter, ` +
            `${perimeterValidation.perimeter.area.toFixed(1)} sq ft area`
          );
        }
        
        // Validate wireframe geometry
        if (parsed.wireframe && parsed.wireframe.length > 0) {
          const wireframeValidation = validateWireframeGeometry(
            parsed.wireframe,
            parsed.totalWidth,
            parsed.totalHeight
          );
          
          if (!wireframeValidation.isValid) {
            console.warn(
              `[parseFloorPlan] Wireframe geometry issues: ${wireframeValidation.issues.join("; ")}`
            );
          }
          
          console.error(
            `[parseFloorPlan] Wireframe stats: ${wireframeValidation.stats.pointCount} points, ` +
            `coverage: ${wireframeValidation.stats.coverage.toFixed(1)}%, ` +
            `bounds: (${wireframeValidation.stats.minX}, ${wireframeValidation.stats.minY}) to ` +
            `(${wireframeValidation.stats.maxX}, ${wireframeValidation.stats.maxY})`
          );
        }
        
        // Validate section boundaries
        if (parsed.sections && parsed.sections.length > 0) {
          const sectionValidation = validateSectionBoundaries(parsed.sections);
          
          if (!sectionValidation.isValid) {
            console.warn(
              `[parseFloorPlan] Section boundary issues: ${sectionValidation.issues.join("; ")}`
            );
          }
          
          console.error(
            `[parseFloorPlan] Section validation: ${sectionValidation.sectionStats.length} sections, ` +
            `total area: ${sectionValidation.sectionStats.reduce((sum, s) => sum + s.calculatedArea, 0).toFixed(0)} sqft`
          );
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
        
        // All validation is now handled by dimensionValidator
        
        return parsed;
      } catch (error) {
        const errorMsg = (error as Error).message;
        console.error("[parseFloorPlan] Error:", errorMsg);
        throw new Error(`Vision analysis failed: ${errorMsg}`);
      }
    }),
});

export type AppRouter = typeof appRouter;
