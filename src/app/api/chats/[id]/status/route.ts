import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { status } = await req.json(); // "open" | "closed"
  const conversationId = params.id;

  // TODO: persist status (DB or Twilio attributes)
  // Example Twilio attributes update as above.

  return NextResponse.json({ ok: true });
}
