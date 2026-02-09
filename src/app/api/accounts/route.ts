import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const COLLECTION_NAME = "accounts";

export async function GET() {
  try {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const accounts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Error fetching accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const docRef = await db.collection(COLLECTION_NAME).add(data);
    return NextResponse.json({ id: docRef.id, ...data }, { status: 201 });
  } catch (error) {
    console.error("Error adding account:", error);
    return NextResponse.json(
      { error: "Error adding account" },
      { status: 500 }
    );
  }
}
