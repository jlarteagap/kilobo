import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const COLLECTION_NAME = "accounts";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params are async in Next.js 15+!
) {
  try {
    const { id } = await params;
    const data = await request.json();
    await db.collection(COLLECTION_NAME).doc(id).update(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Error updating account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.collection(COLLECTION_NAME).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Error deleting account" },
      { status: 500 }
    );
  }
}
