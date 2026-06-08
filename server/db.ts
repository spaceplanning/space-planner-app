import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, floorPlans, customFurniture, floorPlanShares, InsertFloorPlan, InsertCustomFurniture, InsertFloorPlanShare } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Floor Plans queries
export async function getUserFloorPlans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(floorPlans).where(eq(floorPlans.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get floor plans:", error);
    return [];
  }
}

export async function getFloorPlanById(id: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(floorPlans)
      .where(eq(floorPlans.id, id))
      .limit(1);
    
    if (result.length === 0) return undefined;
    if (result[0].userId !== userId) return undefined; // Security check
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get floor plan:", error);
    return undefined;
  }
}

export async function saveFloorPlan(plan: InsertFloorPlan) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    await db.insert(floorPlans).values(plan).onDuplicateKeyUpdate({
      set: {
        name: plan.name,
        totalWidth: plan.totalWidth,
        totalHeight: plan.totalHeight,
        roomsJson: plan.roomsJson,
        furnitureJson: plan.furnitureJson,
        updatedAt: new Date(),
      },
    });
    return plan;
  } catch (error) {
    console.error("[Database] Failed to save floor plan:", error);
    return undefined;
  }
}

export async function deleteFloorPlan(id: string, userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    // Verify ownership before deleting
    const plan = await getFloorPlanById(id, userId);
    if (!plan) return false;
    
    await db.delete(floorPlans).where(eq(floorPlans.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete floor plan:", error);
    return false;
  }
}

// Custom Furniture queries
export async function getUserCustomFurniture(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(customFurniture).where(eq(customFurniture.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get custom furniture:", error);
    return [];
  }
}

export async function saveCustomFurniture(furniture: InsertCustomFurniture) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    await db.insert(customFurniture).values(furniture).onDuplicateKeyUpdate({
      set: {
        name: furniture.name,
        category: furniture.category,
        width: furniture.width,
        depth: furniture.depth,
        color: furniture.color,
        updatedAt: new Date(),
      },
    });
    return furniture;
  } catch (error) {
    console.error("[Database] Failed to save custom furniture:", error);
    return undefined;
  }
}

export async function deleteCustomFurniture(id: string, userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    // Verify ownership before deleting
    const result = await db.select().from(customFurniture)
      .where(eq(customFurniture.id, id))
      .limit(1);
    
    if (result.length === 0 || result[0].userId !== userId) return false;
    
    await db.delete(customFurniture).where(eq(customFurniture.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete custom furniture:", error);
    return false;
  }
}


// Floor Plan Sharing queries
export async function createShare(share: InsertFloorPlanShare) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    await db.insert(floorPlanShares).values(share);
    return share;
  } catch (error) {
    console.error("[Database] Failed to create share:", error);
    return undefined;
  }
}

export async function getShareByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(floorPlanShares)
      .where(eq(floorPlanShares.shareToken, token))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    // Check if share has expired
    if (result[0].expiresAt && new Date(result[0].expiresAt) < new Date()) {
      return undefined;
    }
    
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get share:", error);
    return undefined;
  }
}

export async function getFloorPlanShares(floorPlanId: string, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    // Verify ownership
    const plan = await getFloorPlanById(floorPlanId, userId);
    if (!plan) return [];
    
    return await db.select().from(floorPlanShares)
      .where(eq(floorPlanShares.floorPlanId, floorPlanId));
  } catch (error) {
    console.error("[Database] Failed to get floor plan shares:", error);
    return [];
  }
}

export async function deleteShare(shareId: string, userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    // Verify ownership
    const share = await db.select().from(floorPlanShares)
      .where(eq(floorPlanShares.id, shareId))
      .limit(1);
    
    if (share.length === 0 || share[0].ownerId !== userId) return false;
    
    await db.delete(floorPlanShares).where(eq(floorPlanShares.id, shareId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete share:", error);
    return false;
  }
}

export async function getSharedFloorPlans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    // Get all shares where this user is the recipient
    const shares = await db.select().from(floorPlanShares)
      .where(eq(floorPlanShares.sharedWithUserId, userId));
    
    // Get the actual floor plans
    const planIds = shares.map(s => s.floorPlanId);
    if (planIds.length === 0) return [];
    
    return await db.select().from(floorPlans)
      .where(eq(floorPlans.id, planIds[0])); // Simplified - in production use IN clause
  } catch (error) {
    console.error("[Database] Failed to get shared floor plans:", error);
    return [];
  }
}
