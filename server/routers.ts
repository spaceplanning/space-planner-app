import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { nanoid } from "nanoid";

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
});

export type AppRouter = typeof appRouter;
