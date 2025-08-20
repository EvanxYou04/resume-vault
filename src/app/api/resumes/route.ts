import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request:NextRequest) {
    try {
        const {title, fileUrl, tags, userId} = await request.json();

        if (!title || !fileUrl || !userId) {
            return NextResponse.json(
                { error: 'title, fileUrl, and userId are required'},
                { status: 400}
            );
        }

        const resume = await prisma.resume.create({
            data: {
                title,
                fileUrl,
                tags: tags || [],
                userId,
            },
        });

        return NextResponse.json(resume, {status: 201});
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
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        const resumes = await prisma.resume.findMany({
            where: { userId },
            orderBy: {createdAt: 'desc' },
        });

        return NextResponse.json(resumes);
    } catch (err) {
        console.error('Error fetching resumes:', err);
        return NextResponse.json(
            { error: 'Failed to fetch resumes'},
            { status: 500 }
        );
    }
}