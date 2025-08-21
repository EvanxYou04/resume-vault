'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navbar() {
    const { data: session, status } = useSession();

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-gray-900">
                            Resume Vault
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {status === 'loading' ? (
                            <div className="text-gray-500">Loading...</div>
                        ) : session ? (
                            <>
                                <Link
                                    href="/upload"
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Upload
                                </Link>
                                <div className="flex items-center space-x-3">
                                    <span className="text-gray-700 text-sm">
                                        {session.user?.name}
                                    </span>
                                    <button
                                        onClick={() => signOut()}
                                        className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => signIn()}
                                className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
