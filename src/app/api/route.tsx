import Ably from "ably";
import { randomUUID } from "crypto";

export const revalidate = 0;

export async function GET() {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    return new Response("ABLY_API_KEY not set", { status: 500 });
  }

  try {
    const client = new Ably.Rest(apiKey);
    const clientId = randomUUID();

    const tokenRequestData = await client.auth.createTokenRequest({
      clientId,
    });

    return Response.json(tokenRequestData);
  } catch (err) {
    console.error("Ably token request failed", err);
    return new Response("Ably token request failed", { status: 500 });
  }
}
