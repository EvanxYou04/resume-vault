import { NextRequest, NextResponse } from "next/server";
import { getUploadUrl } from "@/lib/s3";


export async function POST(request: NextRequest) {
    try {
        const { fileName, fileType} = await request.json();

        if (!fileName || !fileType) {
            return NextResponse.json(
                { error: 'fileName and fileType are required' },
                { status: 400 }
            );
        }

        if (!fileType.includes('pdf')) {
            return NextResponse.json(
                { error: 'Only PDF file type is allowed'},
                { status: 400 }
            );
        }

        const timestamp = Date.now();
        const uniqueFileName = `resumes/${timestamp}-${fileName}`;

        const uploadUrl = await getUploadUrl(uniqueFileName, fileType);

        return NextResponse.json({
            uploadUrl,
            fileKey: uniqueFileName
        });
    } catch (err) {
        console.error('Error generating uplaod URL', err);
        return NextResponse.json(
            { error: 'Failed to generate upload URL'},
            { status: 500 }
        );
    }
};