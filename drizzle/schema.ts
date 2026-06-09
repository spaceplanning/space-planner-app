import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Floor plans table — stores user's floor plan layouts
 */
export const floorPlans = mysqlTable("floorPlans", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  totalWidth: int("totalWidth").notNull().default(0),
  totalHeight: int("totalHeight").notNull().default(0),
  // Store rooms and furniture as JSON
  roomsJson: text("roomsJson").notNull().default("[]"),
  furnitureJson: text("furnitureJson").notNull().default("[]"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FloorPlan = typeof floorPlans.$inferSelect;
export type InsertFloorPlan = typeof floorPlans.$inferInsert;

/**
 * Custom furniture table — stores user's custom furniture templates
 */
export const customFurniture = mysqlTable("customFurniture", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  width: int("width").notNull(), // in inches
  depth: int("depth").notNull(), // in inches
  color: varchar("color", { length: 7 }).notNull().default("#4a9eff"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomFurniture = typeof customFurniture.$inferSelect;
export type InsertCustomFurniture = typeof customFurniture.$inferInsert;


/**
 * Floor plan shares table — stores sharing permissions and tokens
 */
export const floorPlanShares = mysqlTable("floorPlanShares", {
  id: varchar("id", { length: 64 }).primaryKey(),
  floorPlanId: varchar("floorPlanId", { length: 64 }).notNull(),
  ownerId: int("ownerId").notNull(),
  sharedWithUserId: int("sharedWithUserId"), // null if public link
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  permission: mysqlEnum("permission", ["view", "edit"]).default("view").notNull(),
  expiresAt: timestamp("expiresAt"), // null if no expiration
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FloorPlanShare = typeof floorPlanShares.$inferSelect;
export type InsertFloorPlanShare = typeof floorPlanShares.$inferInsert;
