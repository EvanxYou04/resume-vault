import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { email, name } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'email is required' },
                { status: 400 }
            );
        }

        const user = await prisma.user.create({
            data: {
                email,
                name: name || null,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (err) {
        console.error('Error creating user:', err);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const users = await prisma.user.findMany({
            include: { resumes: true },
        });

        return NextResponse.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
