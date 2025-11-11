import React, { useState } from 'react';

interface GoalInputProps {
  onSubmit: (goal: string) => void;
  isLoading: boolean;
  hasActiveSession: boolean;
  onClear: () => void;
}

const GoalInput: React.FC<GoalInputProps> = ({ onSubmit, isLoading, hasActiveSession, onClear }) => {
  const [goal, setGoal] = useState('');

  const exampleGoals = [
    "Research the top 3 AI startups funded in 2024, find their funding amounts, and create a summary.",
    "Find the weather in Bengaluru today and tell me if it will rain.",
    "What were the key announcements from Apple's latest event? Summarize them.",
  ];

  const handleExampleClick = (example: string) => {
    setGoal(example);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim() && !isLoading) {
      onSubmit(goal.trim());
    }
  };

  if (hasActiveSession) {
    return (
      <div className="text-center">
        <button
          onClick={onClear}
          disabled={isLoading}
          className="bg-brand-secondary hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
        >
          Start New Goal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Enter your goal here..."
          rows={2}
          className="flex-grow bg-brand-primary border border-brand-primary focus:ring-2 focus:ring-brand-accent focus:border-brand-accent rounded-lg p-3 text-brand-text placeholder-brand-text-muted transition duration-300 w-full resize-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !goal.trim()}
          className="bg-brand-accent hover:bg-opacity-80 text-brand-bg font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Start'}
        </button>
      </form>
       <div className="pt-2 text-center">
          <p className="text-sm text-brand-text-muted mb-2">Or try an example:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {exampleGoals.map((ex, i) => (
                <button 
                  key={i} 
                  onClick={() => handleExampleClick(ex)} 
                  className="text-xs bg-brand-primary hover:bg-opacity-70 text-brand-text-muted px-3 py-1 rounded-full transition-colors"
                >
                  {`Ex ${i+1}`}
                </button>
            ))}
          </div>
       </div>
    </div>
  );
};

export default GoalInput;