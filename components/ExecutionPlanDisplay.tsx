
import React from 'react';
import { ExecutionPlan } from '../types';
import TaskItem from './TaskItem';

interface ExecutionPlanDisplayProps {
  plan: ExecutionPlan;
}

const ExecutionPlanDisplay: React.FC<ExecutionPlanDisplayProps> = ({ plan }) => {
  return (
    <div className="bg-brand-surface rounded-xl shadow-2xl p-6">
      <h2 className="text-2xl font-bold text-brand-accent mb-4 border-b-2 border-brand-primary pb-2">
        Execution Plan
      </h2>
      <div className="space-y-3">
        {plan.tasks.map((task, index) => (
          <TaskItem key={task.id} task={task} index={index} />
        ))}
      </div>
    </div>
  );
};

export default ExecutionPlanDisplay;
