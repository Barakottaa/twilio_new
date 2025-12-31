import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Logs directory is in the root of the workspace
// twilio_chat is at d:\Programming_projects\twilio_new\twilio_chat
// logs is at d:\Programming_projects\twilio_new\logs
// process.cwd() in Next.js usually points to the project root (twilio_chat)
const LOGS_DIR = path.join(process.cwd(), '../logs');

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const type = searchParams.get('type') || 'combined'; // 'combined' or 'error'

        const filename = `${date}-${type}.log`;
        const filePath = path.join(LOGS_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ logs: [], message: 'Log file not found' });
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Parse NDJSON
        const logs = fileContent
            .split('\n')
            .filter(line => line.trim())
            .map((line, index) => {
                try {
                    const parsed = JSON.parse(line);
                    return { id: index, ...parsed };
                } catch (e) {
                    return { id: index, message: line, level: 'unknown', timestamp: null };
                }
            })
            .reverse();

        return NextResponse.json({ logs });
    } catch (error: any) {
        console.error('Error reading logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
