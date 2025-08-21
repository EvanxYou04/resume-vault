'use client';

import Link from 'next/link';
import { useRef } from 'react';
import ResumeUploader from "@/components/ResumeUploader";
import ResumeList from "@/components/ResumeList";

export default function UploadPage() {
    const resumeListRef = useRef<{ refreshResumes: () => void }>(null);

    const handleUploadSuccess = () => {
        // Refresh the resume list when upload succeeds
        resumeListRef.current?.refreshResumes();
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-center mb-8">Upload & Manage Resumes</h1>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Upload New Resume</h2>
                    <ResumeUploader onUploadSuccess={handleUploadSuccess} />
                </div>
                <div>
                    <ResumeList ref={resumeListRef} />
                </div>
            </div>
        </div>
    );
}