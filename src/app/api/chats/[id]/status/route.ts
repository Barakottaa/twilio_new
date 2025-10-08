import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { status } = await req.json(); // "open" | "closed"
  const { id: conversationId } = await params;

  // TODO: persist status (DB or Twilio attributes)
  // Example Twilio attributes update as above.

  return NextResponse.json({ ok: true });
}
