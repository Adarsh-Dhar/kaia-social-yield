import { Client, middleware, FollowEvent, ClientConfig, MiddlewareConfig } from '@line/bot-sdk';
import { NextApiRequest, NextApiResponse } from 'next';

// --- IMPORTANT: Store these in your environment variables (.env.local) ---
const botConfig: ClientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

// Initialize LINE Bot SDK client
const client = new Client(botConfig);

// This is a middleware from the LINE SDK to handle request validation.
// We need to run it manually in Next.js API routes.
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    // Add originalUrl property for LINE middleware compatibility
    (req as any).originalUrl = req.url;
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // We only accept POST requests from LINE's servers
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // First, run the LINE middleware to validate the request signature
    const middlewareConfig: MiddlewareConfig = {
      channelSecret: process.env.LINE_CHANNEL_SECRET!,
    };
    await runMiddleware(req, res, middleware(middlewareConfig));

    const events = req.body.events;

    // Process all events in the request
    const results = await Promise.all(
      events.map(async (event: any) => {
        // We are only interested in 'follow' events
        if (event.type === 'follow') {
          return handleFollowEvent(event);
        }
        // You could handle other events here too, like 'unfollow' or 'message'
      })
    );
    
    // Respond to LINE's server with a 200 OK to acknowledge receipt
    return res.status(200).json({ status: 'success', results });

  } catch (err) {
    console.error('Error processing LINE webhook:', err instanceof Error ? err.message : 'Unknown error');
    // It's important to still respond, even with an error
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Handles the logic for a 'follow' event.
 * @param {FollowEvent} event - The follow event from the webhook.
 */
const handleFollowEvent = async (event: FollowEvent) => {
  // The user's unique LINE ID
  const userId = event.source.userId;

  if (!userId) {
    console.error('Follow event did not contain a userId.');
    return;
  }
  
  // --- DEMO LOGIC STARTS HERE ---
  // We'll use a hardcoded user ID for the demo walkthrough.
  // In a real application, you would look this user up in your database.
  const hardcodedFollowerId = 'U1234567890abcdef1234567890abcdef';

  console.log(`Received follow event from user: ${userId}`);

  if (userId === hardcodedFollowerId) {
    // This is our known user for the demo.
    console.log(`✅ SUCCESS: The hardcoded demo user (${userId}) has completed the 'follow' mission.`);
    // In a real app, you would now update your database to mark the mission as complete.
  } else {
    // This is a different user.
    console.log(`ℹ️ INFO: An unknown user (${userId}) followed the account. No mission action taken.`);
  }
  // --- DEMO LOGIC ENDS HERE ---
  
  return { status: 'processed_follow', userId };
};

// NOTE: The LINE SDK middleware needs the raw body to validate the signature.
// Next.js parses the body by default, so we need to disable that for this route.
export const apiConfig = {
  api: {
    bodyParser: false,
  },
};

