
import { useState, useCallback, useRef } from 'react';
import { ExecutionPlan, Task, TaskStatus, TaskResult } from '../types';
import { executeTool } from '../services/toolService';

interface UseExecutionEngineProps {
  onUpdateTask: (task: Task) => void;
  onSetFinalResult: (result: string) => void;
  generateFinalSummary: (goal: string, results: TaskResult[]) => Promise<string>;
}

export const useExecutionEngine = ({ onUpdateTask, onSetFinalResult, generateFinalSummary }: UseExecutionEngineProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const taskResultsRef = useRef<Map<string, TaskResult>>(new Map());

  const executePlan = useCallback(async (plan: ExecutionPlan, goal: string) => {
    setIsRunning(true);
    taskResultsRef.current.clear();
    let remainingTasks = [...plan.tasks];

    while (remainingTasks.length > 0) {
      const executableTasks = remainingTasks.filter(task =>
        task.dependsOn.every(depId =>
          taskResultsRef.current.has(depId) &&
          taskResultsRef.current.get(depId)?.status === TaskStatus.Succeeded
        )
      );

      if (executableTasks.length === 0 && remainingTasks.length > 0) {
        // Break loop if there are remaining tasks but none are executable (circular dependency or failed dependencies)
        const tasksToSkip = remainingTasks.map(t => ({
            ...t,
            status: TaskStatus.Skipped,
            error: "Skipped due to unmet or failed dependencies."
        }));
        tasksToSkip.forEach(onUpdateTask);
        break;
      }
      
      const promises = executableTasks.map(async task => {
        try {
          onUpdateTask({ ...task, status: TaskStatus.Running });
          const dependencies = task.dependsOn.reduce((acc, depId) => {
            acc[depId] = taskResultsRef.current.get(depId)?.result;
            return acc;
          }, {} as Record<string, any>);
          
          const result = await executeTool(task.tool, task.args, dependencies);
          
          const taskResult = { id: task.id, status: TaskStatus.Succeeded, result };
          taskResultsRef.current.set(task.id, taskResult);
          onUpdateTask({ ...task, status: TaskStatus.Succeeded, result: typeof result === 'string' ? result : JSON.stringify(result) });
        } catch (error: any) {
          const errorMessage = error.message || 'An unknown error occurred';
          const taskResult = { id: task.id, status: TaskStatus.Failed, result: null, error: errorMessage };
          taskResultsRef.current.set(task.id, taskResult);
          onUpdateTask({ ...task, status: TaskStatus.Failed, error: errorMessage, result: null });
        }
      });

      await Promise.allSettled(promises);
      
      const executedIds = new Set(executableTasks.map(t => t.id));
      remainingTasks = remainingTasks.filter(t => !executedIds.has(t.id));

      // Skip tasks whose dependencies have failed
      const tasksToSkip = remainingTasks.filter(task =>
        task.dependsOn.some(depId =>
          taskResultsRef.current.has(depId) &&
          taskResultsRef.current.get(depId)?.status === TaskStatus.Failed
        )
      );

      if (tasksToSkip.length > 0) {
        const tasksToSkipIds = new Set(tasksToSkip.map(t => t.id));
        tasksToSkip.forEach(t => {
            onUpdateTask({ ...t, status: TaskStatus.Skipped, error: "Skipped due to a failed dependency." });
            taskResultsRef.current.set(t.id, { id: t.id, status: TaskStatus.Skipped, result: null, error: "Dependency failed" });
        });
        remainingTasks = remainingTasks.filter(t => !tasksToSkipIds.has(t.id));
      }
    }
    
    const finalResults = Array.from(taskResultsRef.current.values());
    const summary = await generateFinalSummary(goal, finalResults);
    onSetFinalResult(summary);

    setIsRunning(false);
  }, [onUpdateTask, onSetFinalResult, generateFinalSummary]);

  return { executePlan, isRunning };
};
