'use client';

import { useState, useEffect } from 'react';

interface Resume {
  id: string;
  title: string;
  fileUrl: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ResumeList({ userId }: { userId: string }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, [userId]);

  const fetchResumes = async () => {
    try {
      const response = await fetch(`/api/resumes?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }
      const data = await response.json();
      setResumes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading resumes...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
        {error}
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No resumes uploaded yet. Upload your first resume above!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Your Resumes</h2>
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg">{resume.title}</h3>
            <span className="text-sm text-gray-500">
              {new Date(resume.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          {resume.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {resume.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <a
            href={resume.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
          >
            📄 View Resume
            <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-1a1 1 0 10-2 0v1H5V7h1a1 1 0 000-2H5z" />
            </svg>
          </a>
        </div>
      ))}
    </div>
  );
}
