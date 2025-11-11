
import React from 'react';

interface ResultDisplayProps {
  result: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  return (
    <div className="bg-brand-surface rounded-xl shadow-2xl p-6">
      <h2 className="text-2xl font-bold text-brand-accent mb-4 border-b-2 border-brand-primary pb-2">
        Final Result
      </h2>
      <div
        className="prose prose-invert prose-p:text-brand-text prose-headings:text-brand-accent max-w-none"
        dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }} 
      />
    </div>
  );
};

export default ResultDisplay;
