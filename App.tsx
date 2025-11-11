
import React, { useState, useCallback, useEffect } from 'react';
import { AgentState, Task, TaskStatus } from './types';
import { useExecutionEngine } from './hooks/useExecutionEngine';
import GoalInput from './components/GoalInput';
import ExecutionPlanDisplay from './components/ExecutionPlanDisplay';
import ResultDisplay from './components/ResultDisplay';
import { generatePlan, generateFinalSummary } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';

const App: React.FC = () => {
  const [agentState, setAgentState] = useLocalStorage<AgentState | null>('agentState', null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpdateTask = useCallback((updatedTask: Task) => {
    setAgentState(prevState => {
      if (!prevState || !prevState.plan) return prevState;
      const newTasks = prevState.plan.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
      return { ...prevState, plan: { ...prevState.plan, tasks: newTasks } };
    });
  }, [setAgentState]);

  const onSetFinalResult = useCallback((result: string) => {
    setAgentState(prevState => {
      if (!prevState) return null;
      return { ...prevState, finalResult: result, isDone: true };
    });
  }, [setAgentState]);

  const { executePlan, isRunning } = useExecutionEngine({
    onUpdateTask,
    onSetFinalResult,
    generateFinalSummary,
  });

  const handleGoalSubmit = async (goal: string) => {
    if (isRunning) return;
    setIsLoading(true);
    setError(null);
    setAgentState({ goal, plan: null, finalResult: null, isDone: false });
    
    try {
      const plan = await generatePlan(goal);
      const initialState: AgentState = {
        goal,
        plan,
        finalResult: null,
        isDone: false
      };
      setAgentState(initialState);
      executePlan(plan, goal);
    } catch (e) {
      console.error(e);
      setError('Failed to generate a plan. The AI might be unavailable or the goal too complex. Please try again.');
      setAgentState(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearState = () => {
    setAgentState(null);
    setError(null);
  };

  const isCompleted = agentState?.isDone;
  const hasPlan = agentState?.plan?.tasks && agentState.plan.tasks.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg to-brand-primary font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-brand-accent tracking-wider">
            Autonomous AI Agent
          </h1>
          <p className="text-brand-text-muted mt-2">
            Your personal AI assistant to achieve complex goals.
          </p>
        </header>

        <main className="space-y-8">
          <div className="bg-brand-surface rounded-xl shadow-2xl p-6">
            <GoalInput onSubmit={handleGoalSubmit} isLoading={isLoading || isRunning} hasActiveSession={!!agentState} onClear={clearState} />
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
          </div>

          {isLoading && !hasPlan && (
            <div className="text-center p-6 bg-brand-surface rounded-xl shadow-lg">
              <p className="text-brand-accent animate-pulse-fast">Generating execution plan...</p>
            </div>
          )}

          {agentState?.plan && (
            <div className="space-y-8">
              <ExecutionPlanDisplay plan={agentState.plan} />
              {isCompleted && agentState.finalResult && (
                <ResultDisplay result={agentState.finalResult} />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
