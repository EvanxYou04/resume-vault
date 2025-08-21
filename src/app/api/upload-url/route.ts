import { NextRequest, NextResponse } from "next/server";
import { getUploadUrl } from "../../../lib/s3";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - Please sign in' },
                { status: 401 }
            );
        }

        const { fileName, contentType } = await request.json();

        if (!fileName || !contentType) {
            return NextResponse.json(
                { error: 'fileName and contentType are required' },
                { status: 400 }
            );
        }

        // Include user ID in the file path for organization
        const userFileKey = `users/${session.user.id}/${fileName}`;
        const uploadUrl = await getUploadUrl(userFileKey, contentType);

        return NextResponse.json({ 
            uploadUrl,
            fileKey: userFileKey 
        });
    } catch (err) {
        console.error('Error generating upload URL:', err);
        return NextResponse.json(
            { error: 'Failed to generate upload URL' },
            { status: 500 }
        );
    }
}