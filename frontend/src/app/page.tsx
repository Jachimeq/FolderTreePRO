"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import BillingPanel from "../components/BillingPanel";
import LoginPanel from "../components/LoginPanel";
import FolderTreeUI from "../views/FolderTreeUI";

export default function Home() {
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "fail">("checking");
  const { data: session } = useSession();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000") + "/graphql";
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "{ hello }" }),
        });
        const json = await res.json();
        if (!cancelled && json?.data?.hello) setApiStatus("ok");
        else if (!cancelled) setApiStatus("fail");
      } catch (err) {
        console.log("Backend not available, running in demo mode");
        if (!cancelled) setApiStatus("fail");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!session) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4 header-responsive">
                {/* Logo Section */}
                <div className="flex items-center space-x-4 header-logo">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md text-white font-bold">
                      FT
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">FolderTree</div>
                      <div className="text-xs text-gray-500 font-medium">PRO</div>
                    </div>
                  </div>
                </div>

                {/* Auth Section */}
                <div className="flex items-center header-actions">
                  <button onClick={() => signIn("github")} className="btn-primary">
                    Sign in with GitHub
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                  Organize your files with AI
                </h1>
                <p className="text-lg text-gray-600">
                  Smart categorization, searchable folders, and team-ready sync. Your
                  workspace stays clean while AI does the heavy lifting.
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={() => signIn("github")} className="btn-primary">
                    Get started
                  </button>
                  <a href="#features" className="btn-secondary">
                    Learn more
                  </a>
                </div>
              </div>
              <div>
                <LoginPanel />
              </div>
            </div>
          </main>
        </div>

        <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50 mt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md text-white font-bold text-sm">
                    FT
                  </div>
                                <div className="flex items-center gap-3 header-actions">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                    apiStatus === "ok" ? "bg-green-100 text-green-700" : apiStatus === "checking" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                                  }`}>
                                    {apiStatus === "ok" ? "API Online" : apiStatus === "checking" ? "Checking API" : "Demo Mode"}
                                  </span>
                    <div className="text-lg font-bold text-gray-900">FolderTree</div>
                    <div className="text-xs text-gray-500">PRO</div>
                  </div>
                </div>
                <p className="text-gray-600 text-base leading-relaxed">
                  Organize your files with AI-powered assistance.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li>AI-powered categorization</li>
                  <li>Searchable folders</li>
                  <li>Team collaboration</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Get Started</h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li><a href="#pricing" className="hover:text-gray-900 transition-colors duration-200">Pricing</a></li>
                  <li><a href="#docs" className="hover:text-gray-900 transition-colors duration-200">Documentation</a></li>
                  <li><a href="#support" className="hover:text-gray-900 transition-colors duration-200">Support</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200/50 mt-12 pt-8 text-center">
              <p className="text-sm text-gray-500">
                © 2025 FolderTree Pro. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 header-responsive">
            {/* Logo Section */}
            <div className="flex items-center space-x-4 header-logo">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md text-white font-bold">
                  FT
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">FolderTree</div>
                  <div className="text-xs text-gray-500 font-medium">PRO</div>
                </div>
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-6 header-actions">
              {/* API Status Badge */}
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                apiStatus === "ok" ? "bg-green-100 text-green-700" : apiStatus === "checking" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
              }`}>
                {apiStatus === "ok" ? "API Online" : apiStatus === "checking" ? "Checking API" : "Demo Mode"}
              </span>
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white">
                  <span className="text-white text-sm font-bold">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                  <p className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-2 py-1 rounded-md font-medium">
                    Premium
                  </p>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={() => signOut()}
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 fade-in">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="border-b border-gray-200/50 px-8 py-8 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                <div className="flex items-start justify-between mobile-stack mobile-spacing">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">File Organizer</h2>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        Manage and organize your files with AI-powered assistance
                      </p>
                    </div>
                  </div>

                  {/* Status Badge - Separated for better organization */}
                  <div className="ml-6 flex-shrink-0">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
                        apiStatus === "ok"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : apiStatus === "checking"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                      aria-live="polite"
                    >
                      {apiStatus === "checking" && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                      <span
                        className={`h-2 w-2 rounded-full ${
                          apiStatus === "ok"
                            ? "bg-green-500"
                            : apiStatus === "checking"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                      />
                      {apiStatus === "ok"
                        ? "Backend OK"
                        : apiStatus === "checking"
                        ? "Checking..."
                        : "Backend Error"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <FolderTreeUI />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="xl:col-span-1">
            <div className="space-y-6">
              {/* Account Information Card */}
              <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Account</h4>
                    <p className="text-xs text-gray-500">Personal Information</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                    <p className="text-sm text-gray-600">{session.user?.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Premium
                    </span>
                  </div>
                </div>
              </div>

              {/* Billing Panel */}
              <div id="billing">
                <BillingPanel />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="mt-16 bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md text-white font-bold text-sm">
                  FT
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">FolderTree</div>
                  <div className="text-xs text-gray-500">PRO</div>
                </div>
              </div>
              <p className="text-gray-600 text-base max-w-md leading-relaxed">
                Organize your files with AI-powered assistance. Smart categorization, searchable folders, and team-ready sync.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-gray-900 transition-colors duration-200">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-900 transition-colors duration-200">Pricing</a></li>
                <li><a href="#docs" className="hover:text-gray-900 transition-colors duration-200">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#help" className="hover:text-gray-900 transition-colors duration-200">Help Center</a></li>
                <li><a href="#contact" className="hover:text-gray-900 transition-colors duration-200">Contact Us</a></li>
                <li><a href="#status" className="hover:text-gray-900 transition-colors duration-200">System Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200/50 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2025 FolderTree Pro. All rights reserved.
            </p>
            <div className="flex space-x-8 mt-4 sm:mt-0">
              <a href="#privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Privacy Policy</a>
              <a href="#terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}