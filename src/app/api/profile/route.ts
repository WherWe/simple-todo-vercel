import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, userProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/profile - Fetch user profile
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);

    if (profile.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// POST /api/profile - Create user profile
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { age, gender, occupation, currentWakeTime, idealWakeTime, currentBedtime, idealBedtime, bio } = body;

    // Check if profile already exists
    const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Profile already exists. Use PUT to update." }, { status: 400 });
    }

    const newProfile = await db
      .insert(userProfiles)
      .values({
        userId,
        age,
        gender,
        occupation,
        currentWakeTime,
        idealWakeTime,
        currentBedtime,
        idealBedtime,
        bio,
      })
      .returning();

    return NextResponse.json(newProfile[0], { status: 201 });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}

// PUT /api/profile - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { age, gender, occupation, currentWakeTime, idealWakeTime, currentBedtime, idealBedtime, bio } = body;

    const updatedProfile = await db
      .update(userProfiles)
      .set({
        age,
        gender,
        occupation,
        currentWakeTime,
        idealWakeTime,
        currentBedtime,
        idealBedtime,
        bio,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning();

    if (updatedProfile.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProfile[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// DELETE /api/profile - Delete user profile
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));

    return NextResponse.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
