'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ResumeFormData {
    title: string;
    tags: string[];
    file: File | null;
}

export default function ResumeUploader({
    onUploadSuccess
}: {
    onUploadSuccess?: () => void;
}) {
    const { data: session, status } = useSession();
    const [formData, setFormData] = useState<ResumeFormData>({
        title: '',
        tags: [],
        file: null,
    });
    const [tagInput, setTagInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Show loading state while session is being fetched
    if (status === 'loading') {
        return (
            <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
                <p>Loading...</p>
            </div>
        );
    }

    // Show sign-in prompt if not authenticated
    if (status === 'unauthenticated') {
        return (
            <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
                <p className="text-gray-600 mb-4">Please sign in to upload resumes.</p>
                <button
                    onClick={() => window.location.href = '/api/auth/signin'}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                >
                    Sign In
                </button>
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setFormData(prev => ({ ...prev, file }));
            if (!formData.title) {
                setFormData(prev => ({
                    ...prev,
                    title: file.name.replace('.pdf', '')
                }));
            }
            setError(null);
        } else {
            setError('Please select a PDF file');
        }
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.file || !formData.title) {
            setError('Please provide a title and select a file');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // Step 1: Get upload URL
            console.log('Step 1: Getting upload URL...');
            const uploadResponse = await fetch('/api/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: formData.file.name,
                    contentType: formData.file.type,
                }),
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to get upload URL');
            }

            const { uploadUrl, fileKey } = await uploadResponse.json();
            console.log('Step 1 complete: Got upload URL and fileKey:', fileKey);

            // Step 2: Upload file to S3
            console.log('Step 2: Uploading to S3...');
            const uploadToS3 = await fetch(uploadUrl, {
                method: 'PUT',
                body: formData.file,
                headers: {
                    'Content-Type': formData.file.type,
                },
            });

            console.log('S3 upload response status:', uploadToS3.status);
            if (!uploadToS3.ok) {
                const errorText = await uploadToS3.text();
                console.error('S3 upload failed:', errorText);
                throw new Error(`Failed to upload file to S3: ${uploadToS3.status}`);
            }
            console.log('Step 2 complete: File uploaded to S3');

            // Step 3: Save metadata to database
            console.log('Step 3: Saving metadata to database...');
            const fileUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileKey}`;
            console.log('Environment variables:', {
                bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
                region: process.env.NEXT_PUBLIC_AWS_REGION
            });
            console.log('File URL:', fileUrl);

            const resumeResponse = await fetch('/api/resumes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    fileUrl,
                    tags: formData.tags,
                }),
            });

            if (!resumeResponse.ok) {
                const errorText = await resumeResponse.text();
                console.error('Database save failed:', errorText);
                throw new Error('Failed to save resume metadata');
            }
            console.log('Step 3 complete: Metadata saved to database');

            setSuccess(true);
            setFormData({ title: '', tags: [], file: null });
            // Reset file input
            const fileInput = document.getElementById('file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            // Notify parent component of successful upload
            onUploadSuccess?.();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-green-600 text-lg font-medium mb-2">
                    ✅ Resume uploaded successfully!
                </div>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-green-600 hover:text-green-700 underline"
                >
                    Upload another resume
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
            <div>
                <label htmlFor="file-input" className="block text-sm font-medium mb-2">
                    Select Resume (PDF)
                </label>
                <input
                    id="file-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>

            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Resume Title
                </label>
                <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Software Engineer Resume"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add a skill or tag"
                    />
                    <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isUploading || !formData.file || !formData.title}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {isUploading ? 'Uploading...' : 'Upload Resume'}
            </button>
        </form>
    );
}