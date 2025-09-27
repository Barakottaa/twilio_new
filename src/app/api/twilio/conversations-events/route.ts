// Next.js App Router — Twilio Conversations post-event webhook
import Twilio from "twilio";

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID as string,
  process.env.TWILIO_AUTH_TOKEN as string
);

type ConvEvent = {
  EventType?: string;
  ConversationSid?: string;
  ParticipantSid?: string;
  ParticipantMessagingBinding?: { Address?: string }; // "whatsapp:+20123..."
};

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    const body: any = ct.includes("application/json")
      ? await req.json()
      : Object.fromEntries((await req.formData()).entries());

    const { EventType, ConversationSid, ParticipantSid } = body as ConvEvent;

    console.log('📡 Conversations webhook received:', { EventType, ConversationSid, ParticipantSid });

    if (EventType === "onParticipantAdded") {
      console.log('👤 New participant added event');
      
      if (ConversationSid && ParticipantSid) {
        const participant = await client.conversations.v1
          .conversations(ConversationSid)
          .participants(ParticipantSid)
          .fetch();

        console.log('📋 Participant details:', {
          identity: participant.identity,
          messagingBinding: participant.messagingBinding,
          attributes: participant.attributes
        });

        const attrs = (() => {
          try { return JSON.parse(participant.attributes || "{}"); }
          catch { return {}; }
        })();

        if (!attrs.display_name) {
          const address = participant.messagingBinding?.address as string | undefined;
          const fallbackName = address?.replace("whatsapp:+", "");
          
          console.log('🏷️ Setting fallback display name:', fallbackName);
          
          await client.conversations.v1
            .conversations(ConversationSid)
            .participants(ParticipantSid)
            .update({
              attributes: JSON.stringify({
                ...attrs,
                display_name: attrs.display_name ?? fallbackName,
              }),
            });
            
          console.log('✅ Updated participant attributes with fallback name');
        } else {
          console.log('ℹ️ Participant already has display name:', attrs.display_name);
        }
      }
    } else {
      console.log('ℹ️ Other conversation event:', EventType);
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("❌ Conversations webhook error:", error);
    return new Response("ok", { status: 200 });
  }
}
