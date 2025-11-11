# Autonomous AI Agent System

This project is a web-based autonomous AI agent system designed to break down complex user goals into actionable, multi-step execution plans. The agent utilizes a variety of tools to execute these steps, manages dependencies between tasks, runs independent tasks in parallel, and provides real-time progress updates to the user.

## Core Features

- **AI-Powered Planning**: Leverages the Google Gemini API to parse natural language goals and generate a structured JSON execution plan (a Directed Acyclic Graph of tasks).
- **Tool-Based Execution**: Equipped with a set of tools to interact with the world, including:
  - `webSearch`: Uses Google Search grounding via the Gemini API to find up-to-date information.
  - `calculate`: Safely evaluates mathematical expressions.
  - `getCurrentLocation`: Accesses the browser's geolocation API to find the user's current position.
  - `getLocationCoordinates`: A specialized tool that takes a location name (e.g., "Paris") and returns its precise latitude and longitude.
  - `getWeather`: Finds the current weather for a given location by performing a web search using coordinates provided by another tool.
  - `summarize`: Condenses large blocks of text into concise summaries.
- **Dependency Management & Parallelism**: The execution engine respects task dependencies, ensuring a task only runs after its prerequisites are met. It automatically executes independent tasks in parallel to speed up the process.
- **Real-Time UI Updates**: The user interface reflects the status of each task (Queued, Running, Succeeded, Failed, Skipped) in real-time as the agent works.
- **State Persistence**: The entire state of the agent's run (original goal, execution plan, task results) is persisted in the browser's `localStorage`, so progress is not lost if the page is refreshed.
- **Final Summary Generation**: Once the plan is complete, the agent gathers all successful task results and uses the Gemini API to generate a final, comprehensive summary that directly addresses the user's initial goal.

## How It Works: The Agent Lifecycle

1.  **Goal Input**: The user provides a high-level goal, like "What's the weather like in Mysuru?".
2.  **Planning Phase**:
    - The goal is sent to the Gemini API with a detailed system prompt and a strict JSON schema.
    - The AI's task is to act as a "planner," breaking the goal down into a list of tasks. For the example goal, it would create a two-step plan:
        1.  `getLocationCoordinates` with `args: { "locationName": "Mysuru" }`.
        2.  `getWeather` with `dependsOn: ["task1"]`.
3.  **Execution Phase**:
    - The `useExecutionEngine` hook takes the generated plan and begins processing it.
    - It runs a loop that, on each iteration, identifies all tasks whose dependencies have been successfully met.
    - These "executable" tasks are run in parallel using `Promise.allSettled`.
    - The `toolService` maps each task's tool name to its corresponding implementation function. For instance, `getLocationCoordinates` triggers a specific Gemini API call designed to return structured coordinate data.
    - As each task completes, its status and result (or error) are updated in the central state, and the UI re-renders to show the change.
    - If a task fails, any subsequent tasks that depend on it are automatically marked as "Skipped."
4.  **Summarization Phase**:
    - Once all tasks have been completed, failed, or skipped, the engine gathers the results from all successfully completed tasks.
    - It makes a final call to the Gemini API, providing the original goal and the collected results as context.
    - The AI generates a user-friendly summary, which is then displayed in the UI.

## Core Technologies

- **Frontend**: React, TypeScript
- **AI/LLM**: Google Gemini API (`@google/genai`)
- **Styling**: Tailwind CSS (via CDN)
- **State Persistence**: Browser `localStorage`

## File Structure Overview

```
.
├── index.html                # Main HTML entry point, includes Tailwind CSS
├── index.tsx                 # React application root
├── App.tsx                   # Main application component, manages state and orchestrates the agent
├── types.ts                  # Centralized TypeScript type definitions (Task, AgentState, etc.)
├── components/
│   ├── GoalInput.tsx         # Component for user to enter their goal
│   ├── ExecutionPlanDisplay.tsx # Container for displaying the list of tasks
│   ├── TaskItem.tsx          # Renders a single task with its status and results
│   ├── ResultDisplay.tsx     # Displays the final summary from the agent
│   └── icons/
│       └── StatusIcons.tsx   # SVG icons for task statuses
├── hooks/
│   ├── useExecutionEngine.ts # The core logic for running the task plan
│   └── useLocalStorage.ts    # A custom hook to persist state to localStorage
├── services/
│   ├── geminiService.ts      # Handles all direct communication with the Gemini API (planning, summary, tools)
│   └── toolService.ts        # Implements the logic for each tool the agent can use
└── Readme.md                 # This file
```

## How to Run

This application is designed to run in a web environment where a Google Gemini API key is available as an environment variable (`process.env.API_KEY`).

1.  **API Key**: Ensure the environment where you serve this application has the `API_KEY` variable set with a valid Google Gemini API key.
2.  **Open the App**: Simply open the `index.html` file in a modern web browser.
3.  **Use the Agent**:
    - Type your goal into the input box or click an example.
    - Click "Start" to begin the process.
    - Watch as the agent generates a plan and executes it in real-time.
    - To start over, click the "Start New Goal" button that appears after a session starts.

## Try it now
- https://autonomous-ai-agent-564682446225.us-west1.run.app/

