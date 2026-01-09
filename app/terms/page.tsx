'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getActiveTerms, type TermsContent } from '@/lib/utils/termsService'
import ReactMarkdown from 'react-markdown'

export default function TermsPage() {
  const [terms, setTerms] = useState<TermsContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTerms() {
      try {
        const activeTerms = await getActiveTerms()
        setTerms(activeTerms)
      } catch (error) {
        console.error('Error loading terms:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTerms()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-orange-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading terms...</p>
        </div>
      </div>
    )
  }

  if (!terms) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Terms Not Available</h1>
          <p className="text-gray-600 mb-6">
            The terms of use are currently not available. Please contact HSNEF for assistance.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#FF9933] to-[#800000] text-white rounded-md hover:from-[#FF8800] hover:to-[#700000] transition-all"
          >
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF9933] to-[#800000] text-white py-6 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-white hover:text-white/90 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </Link>
          <h1 className="text-3xl font-bold">{terms.title}</h1>
          <p className="mt-2 text-white/90">
            Version {terms.version} | Effective: {new Date(terms.effective_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {terms.content_format === 'markdown' ? (
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-700">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-orange-600">
                      {children}
                    </code>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-orange-600 hover:text-orange-700 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {terms.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-gray-700">{terms.content}</div>
          )}

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Return to Portal
              </Link>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Questions about these terms?</h3>
          <p className="text-sm text-blue-800 mb-3">
            If you have any questions or concerns about these terms, please contact us:
          </p>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:info@hsnef.org" className="underline hover:text-blue-900">
                info@hsnef.org
              </a>
            </p>
            <p>
              <strong>Website:</strong>{' '}
              <a href="https://hsnef.org" className="underline hover:text-blue-900" target="_blank" rel="noopener noreferrer">
                https://hsnef.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
