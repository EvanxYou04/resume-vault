import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

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

        const { title, fileUrl, tags } = await request.json();

        if (!title || !fileUrl) {
            return NextResponse.json(
                { error: 'title and fileUrl are required' },
                { status: 400 }
            );
        }

        // Use the authenticated user's ID
        const resume = await prisma.resume.create({
            data: {
                title,
                fileUrl,
                tags: JSON.stringify(tags || []),
                userId: session.user.id, // Use authenticated user's ID
            },
        });

        return NextResponse.json(resume, { status: 201 });
    } catch (err) {
        console.error('Error creating resume:', err);
        return NextResponse.json(
            { error: 'Failed to create resume' },
            { status: 500 }
        );
    }
}

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
        const search = searchParams.get('search') || '';

        const whereClause = {
            userId: session.user.id, // Only fetch user's own resumes
            ...(search ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { tags: { contains: search, mode: 'insensitive' } },
                ],
            } : {}),
        };

        const resumes = await prisma.resume.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });

        // Parse tags JSON string back to array
        const resumesWithParsedTags = resumes.map((resume: any) => ({
            ...resume,
            tags: JSON.parse(resume.tags)
        }));

        return NextResponse.json(resumesWithParsedTags);
    } catch (err) {
        console.error('Error fetching resumes:', err);
        return NextResponse.json(
            { error: 'Failed to fetch resumes'},
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
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
        const resumeId = searchParams.get('id');

        if (!resumeId) {
            return NextResponse.json(
                { error: 'Resume ID is required' },
                { status: 400 }
            );
        }

        // Verify the resume belongs to the authenticated user
        const existingResume = await prisma.resume.findUnique({
            where: { id: resumeId }
        });

        if (!existingResume) {
            return NextResponse.json(
                { error: 'Resume not found' },
                { status: 404 }
            );
        }

        if (existingResume.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Forbidden - You can only delete your own resumes' },
                { status: 403 }
            );
        }

        await prisma.resume.delete({
            where: { id: resumeId }
        });

        return NextResponse.json({ message: 'Resume deleted successfully' });
    } catch (err) {
        console.error('Error deleting resume:', err);
        return NextResponse.json(
            { error: 'Failed to delete resume' },
            { status: 500 }
        );
    }
}