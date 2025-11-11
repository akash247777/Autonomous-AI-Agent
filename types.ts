
export enum TaskStatus {
  Queued = 'queued',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Skipped = 'skipped',
}

export interface Task {
  id: string;
  description: string;
  tool: 'webSearch' | 'calculate' | 'getWeather' | 'summarize';
  args: Record<string, any>;
  dependsOn: string[];
  status: TaskStatus;
  result: string | null;
  error: string | null;
}

export interface ExecutionPlan {
  tasks: Task[];
}

export interface AgentState {
  goal: string;
  plan: ExecutionPlan | null;
  finalResult: string | null;
  isDone: boolean;
}

export type TaskResult = {
  id: string;
  status: TaskStatus;
  result: any;
  error?: string;
};
