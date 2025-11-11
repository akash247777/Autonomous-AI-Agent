
import React from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon, PlayIcon, SkipIcon, LoadingIcon } from './icons/StatusIcons';

interface TaskItemProps {
  task: Task;
  index: number;
}

const getStatusInfo = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.Queued:
      return { icon: <ClockIcon />, color: 'text-gray-400', label: 'Queued' };
    case TaskStatus.Running:
      return { icon: <LoadingIcon />, color: 'text-blue-400', label: 'Running' };
    case TaskStatus.Succeeded:
      return { icon: <CheckCircleIcon />, color: 'text-green-400', label: 'Succeeded' };
    case TaskStatus.Failed:
      return { icon: <XCircleIcon />, color: 'text-red-400', label: 'Failed' };
    case TaskStatus.Skipped:
      return { icon: <SkipIcon />, color: 'text-yellow-500', label: 'Skipped' };
    default:
      return { icon: <ClockIcon />, color: 'text-gray-400', label: 'Unknown' };
  }
};

const TaskItem: React.FC<TaskItemProps> = ({ task, index }) => {
  const { icon, color, label } = getStatusInfo(task.status);

  return (
    <div className="bg-brand-primary/50 p-4 rounded-lg border border-brand-primary transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${color} mt-1`}>{icon}</div>
        <div className="flex-grow">
          <p className="font-semibold text-brand-text">
            <span className="text-brand-text-muted mr-2">{`Step ${index + 1}:`}</span>
            {task.description}
          </p>
          <div className="text-xs text-brand-text-muted mt-1">
            <span>Tool: <code className="bg-brand-bg px-1.5 py-0.5 rounded">{task.tool}</code></span>
            {task.dependsOn.length > 0 && 
              <span className="ml-4">Depends on: <code className="bg-brand-bg px-1.5 py-0.5 rounded">{task.dependsOn.join(', ')}</code></span>
            }
          </div>
        </div>
      </div>
      {task.result && task.status === TaskStatus.Succeeded && (
        <div className="mt-2 pl-10">
          <p className="text-sm text-green-300 bg-green-900/30 p-2 rounded-md">
            <strong>Result:</strong> {task.result}
          </p>
        </div>
      )}
      {task.error && task.status === TaskStatus.Failed && (
        <div className="mt-2 pl-10">
          <p className="text-sm text-red-300 bg-red-900/30 p-2 rounded-md">
            <strong>Error:</strong> {task.error}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
