import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - Please sign in' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get('fileUrl');

        if (!fileUrl) {
            return NextResponse.json(
                { error: 'fileUrl is required' },
                { status: 400 }
            );
        }

        // Verify the file belongs to the authenticated user
        const resume = await prisma.resume.findFirst({
            where: { 
                fileUrl: fileUrl,
                userId: session.user.id // Only allow access to user's own files
            }
        });

        if (!resume) {
            return NextResponse.json(
                { error: 'File not found or access denied' },
                { status: 404 }
            );
        }

        // Extract the S3 key from the full URL
        const s3Key = fileUrl.split('.amazonaws.com/')[1];

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: s3Key,
        });

        const response = await s3.send(command);
        
        if (!response.Body) {
            throw new Error('No file content received');
        }

        // Convert the stream to bytes
        const bytes = await response.Body.transformToByteArray();
        
        return new NextResponse(bytes, {
            headers: {
                'Content-Type': response.ContentType || 'application/pdf',
                'Content-Length': response.ContentLength?.toString() || '',
                'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
            },
        });
    } catch (err) {
        console.error('Error serving file:', err);
        return NextResponse.json(
            { error: 'Failed to serve file' },
            { status: 500 }
        );
    }
}
