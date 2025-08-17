'use client';

import { useState } from "react";

interface ResumeFormData {
    title: string;
    tags: string[];
    file: File | null;
}

export default function ResumeUploader({ userId }: { userId: string }) {
    const [formData, setFormData] = useState<ResumeFormData>({
        title: '',
        tags: [],
        file: null,
    });
    const [tagInput, setTagInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type == 'application/pdf') {
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

    const handleSumbit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.file || !formData.title) {
            setError('Please provide a title and select a file');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const uploadResponse = await fetch('/api/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: formData.file.name,
                    fileType: formData.file.type,
                }),
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to get upload URL');
            }

            const { uploadUrl, fileKey } = await uploadResponse.json();

            const uploadToS3 = await fetch(uploadUrl, {
                method: 'PUT',
                body: formData.file,
                headers: {
                    'Content-Type': formData.file.type,
                },
            });

            if (!uploadToS3.ok) {
                throw new Error('Failed to upload file');
            }

            const fileUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileKey}`;

            const resumeResponse = await fetch('/api/resumes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    fileUrl,
                    tags: formData.tags,
                    userId,
                }),
            });

            if (!resumeResponse.ok) {
                throw new Error('Failed to save resume metadata');
            }

            setSuccess(true);
            setFormData({ title: '', tags: [], file: null });

            const fileInput = document.getElementById('file-input') as HTMLInputElement
            if (fileInput) fileInput.value = '';


        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }

    };
};