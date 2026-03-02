import { NextApiRequest, NextApiResponse } from 'next';
import app from '../../server/server';

// Optional catch-all route that passes the request to the robust Express backend
// This allows Vercel+Next.js to seamlessly handle the API without vercel.json conflicts.

export const config = {
    api: {
        bodyParser: false, // Let Express handle the body parsing (JSON, URLEncoded, Multer)
        externalResolver: true, // Warn Next.js that Express will handle the response resolution
    },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // Let Express take over the request and response objects natively
    return app(req as any, res as any);
}
