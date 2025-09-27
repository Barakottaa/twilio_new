// Next.js App Router — Twilio Programmable Messaging inbound webhook
import Twilio from "twilio";

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID as string,
  process.env.TWILIO_AUTH_TOKEN as string
);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const waId = form.get("WaId")?.toString();               // e.g. "201234567890"
    const profileName = form.get("ProfileName")?.toString() || "WhatsApp user";

    console.log('📨 Messaging webhook received:', { waId, profileName });

    if (waId) {
      const address = `whatsapp:+${waId}`;
      console.log('🔍 Looking up conversations for address:', address);
      
      const pcs = await client.conversations.v1.participantConversations.list({ address, limit: 20 });
      console.log('📋 Found participant conversations:', pcs.length);
      
      const attrs = JSON.stringify({ display_name: profileName });
      console.log('🏷️ Setting display name:', profileName);

      await Promise.all(
        pcs.map(pc => {
          console.log('🔄 Updating participant:', pc.participantSid, 'in conversation:', pc.conversationSid);
          return client.conversations.v1
            .conversations(pc.conversationSid)
            .participants(pc.participantSid)
            .update({ attributes: attrs });
        })
      );
      
      console.log('✅ Successfully updated participant attributes for:', profileName);
    }

    return new Response("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("❌ Messaging webhook error:", error);
    return new Response("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
