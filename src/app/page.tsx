import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Resume Vault
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Store, organize, and manage your resumes with ease
        </p>
        <Link
          href="/upload"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-xl font-semibold mb-2">Upload Resumes</h3>
          <p className="text-gray-600">
            Easily upload your PDF resumes to secure cloud storage
          </p>
        </div>
        <div className="text-center p-6">
          <div className="text-4xl mb-4">🏷️</div>
          <h3 className="text-xl font-semibold mb-2">Tag & Organize</h3>
          <p className="text-gray-600">
            Add tags to categorize resumes by skills, experience, or industry
          </p>
        </div>
        <div className="text-center p-6">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">Search & Filter</h3>
          <p className="text-gray-600">
            Quickly find the right resume using our powerful search tools
          </p>
        </div>
      </div>
    </div>
  );
}
