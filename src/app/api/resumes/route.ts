import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client/extension";
import { use } from "react";

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