"use client";

import { signIn } from "next-auth/react";

export default function LoginPanel() {
  return (
    <section className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100">
      <h3 className="text-2xl font-bold mb-2">Sign in to FolderTree PRO</h3>
      <p className="text-sm text-gray-600 mb-6">Continue with your GitHub account to sync settings, access billing and team features.</p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => signIn('github')}
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234C5.67 20.5 5 18.9 5 18.9c-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.563 21.8 24 17.302 24 12c0-6.627-5.373-12-12-12z"/></svg>
          Sign in with GitHub
        </button>

        <button
          onClick={() => alert('Sign up flow coming soon')}
          className="btn-secondary w-full"
        >
          Create account
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4">By signing in you agree to our <a className="underline" href="#">Terms</a> and <a className="underline" href="#">Privacy Policy</a>.</p>
    </section>
  );
}
