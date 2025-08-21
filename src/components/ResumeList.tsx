'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useSession } from 'next-auth/react';

interface Resume {
  id: string;
  title: string;
  fileUrl: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ResumeListRef {
  refreshResumes: () => void;
}

const ResumeList = forwardRef<ResumeListRef, {}>(({ }, ref) => {
  const { data: session, status } = useSession();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [filteredResumes, setFilteredResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status !== 'loading') {
      fetchResumes();
    }
  }, [status]);

  useEffect(() => {
    // Filter resumes based on search term
    const filtered = resumes.filter(resume =>
      resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredResumes(filtered);
  }, [resumes, searchTerm]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resumes');
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

  // Expose fetchResumes function to parent via ref
  useImperativeHandle(ref, () => ({
    refreshResumes: fetchResumes
  }));

  const deleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      const response = await fetch(`/api/resumes?id=${resumeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      // Refresh the list after deletion
      fetchResumes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resume');
    }
  };

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return <div className="text-center py-4">Loading...</div>;
  }

  // Show sign-in prompt if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Resumes</h2>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Please sign in to view your resumes.</p>
          <button
            onClick={() => window.location.href = '/api/auth/signin'}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

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

  if (filteredResumes.length === 0 && searchTerm) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Resumes</h2>
          <button
            onClick={fetchResumes}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <input
          type="text"
          placeholder="Search resumes by title or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-center py-8 text-gray-500">
          No resumes found matching "{searchTerm}"
        </div>
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Resumes</h2>
        <button
          onClick={fetchResumes}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <input
        type="text"
        placeholder="Search resumes by title or tags..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {filteredResumes.map((resume) => (
        <div
          key={resume.id}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg">{resume.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {new Date(resume.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => deleteResume(resume.id)}
                className="text-red-500 hover:text-red-700 text-sm"
                title="Delete resume"
              >
                🗑️
              </button>
            </div>
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
            href={`/api/serve-file?key=${encodeURIComponent(resume.fileUrl.split('.amazonaws.com/')[1])}`}
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
});

ResumeList.displayName = 'ResumeList';

export default ResumeList;
