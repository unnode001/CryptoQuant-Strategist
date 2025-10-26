import React, { useState, useCallback } from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface CodeBlockProps {
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslations();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 relative group">
      <button
        onClick={handleCopy}
        title={copied ? t('copied') : t('copyCode')}
        className="absolute top-2 right-2 p-1.5 bg-white text-gray-500 rounded-md border border-gray-200 hover:bg-gray-100 hover:text-gray-800 transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      <pre className="p-4 overflow-x-auto">
        <code className="font-roboto-mono text-sm text-gray-700 whitespace-pre-wrap">
          {code}
        </code>
      </pre>
    </div>
  );
};