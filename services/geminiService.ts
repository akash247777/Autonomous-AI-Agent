import { GoogleGenAI, Type } from '@google/genai';
import { ExecutionPlan, Task, TaskResult, TaskStatus } from '../types';

// This check is to prevent crashes in non-browser environments
const apiKey = typeof process === 'undefined' ? '' : process.env.API_KEY;
if (!apiKey) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

const planSchema = {
  type: Type.OBJECT,
  properties: {
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique identifier for the task, e.g., 'task1'." },
          description: { type: Type.STRING, description: "A short, user-facing description of what this task does." },
          tool: {
            type: Type.STRING,
            enum: ['webSearch', 'calculate', 'getWeather', 'summarize', 'getCurrentLocation', 'getLocationCoordinates'],
            description: "The name of the tool to be used for this task."
          },
          args: {
            type: Type.OBJECT,
            description: "An object containing arguments for the tool. See tool documentation for required args.",
            properties: {
                query: { type: Type.STRING },
                expression: { type: Type.STRING },
                latitude: { type: Type.NUMBER },
                longitude: { type: Type.NUMBER },
                locationName: { type: Type.STRING },
            }
          },
          dependsOn: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of task IDs that this task depends on. The results of these tasks will be available."
          },
        },
        required: ['id', 'description', 'tool', 'args', 'dependsOn'],
      },
    },
  },
  required: ['tasks'],
};

export const generatePlan = async (goal: string): Promise<ExecutionPlan> => {
  const systemInstruction = `You are an expert AI planner. Your job is to break down a user's goal into a series of tasks that can be executed by a machine.

  You have access to the following tools:
  - 'webSearch': Use to find general information on the internet. Args: { "query": "your search query" }.
  - 'calculate': Use for mathematical calculations. Args: { "expression": "e.g., (100 * 1.05^5) - 100" }.
  - 'getCurrentLocation': Use to get the user's current GPS coordinates. Returns { latitude, longitude }. Args: {}.
  - 'getLocationCoordinates': Use to find the geographic coordinates for a named place. Args: { "locationName": "e.g., Mysuru" }. Returns { latitude, longitude }.
  - 'getWeather': Use to get the weather for specific coordinates. The coordinates MUST be provided by a dependency ('getCurrentLocation' or 'getLocationCoordinates'). Args: {}.
  - 'summarize': Use to summarize a large block of text. Args: { "query": "text to summarize" }.

  Rules:
  1.  **Weather for Current Location**: If the goal is about weather at the user's current location (e.g., "weather where I am"), you MUST create two tasks:
      a. A 'getCurrentLocation' task.
      b. A 'getWeather' task that depends on the first one. Its 'args' MUST be empty: {}.
  2.  **Weather for Named Location**: If the goal is about weather for a *named location* (e.g., "weather in Paris"), you MUST create two tasks:
      a. A 'getLocationCoordinates' task with the 'locationName' argument.
      b. A 'getWeather' task that depends on the first one. Its 'args' MUST be empty: {}.
  3.  Create a step-by-step plan as a JSON object with unique 'id's.
  4.  Define dependencies using 'dependsOn'. If a task needs another's output, list the dependency ID.
  5.  For tasks that consume the entire output of a dependency (like getWeather), their 'args' object should be empty ({}). The system handles passing the result automatically.
  
  User Goal: "${goal}"
  
  Generate the JSON execution plan.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: systemInstruction }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: planSchema,
    },
  });

  const planJson = JSON.parse(response.text);
  
  // Add status and result fields to each task
  const tasksWithStatus = planJson.tasks.map((task: Omit<Task, 'status' | 'result' | 'error'>) => ({
    ...task,
    status: TaskStatus.Queued,
    result: null,
    error: null,
  }));

  return { tasks: tasksWithStatus };
};

export const generateFinalSummary = async (goal: string, results: TaskResult[]): Promise<string> => {
    const successfulTasks = results.filter(r => r.status === TaskStatus.Succeeded);

    if (successfulTasks.length === 0) {
        return "The process finished, but no tasks were successfully completed. Unable to provide a final summary.";
    }

    const context = successfulTasks.map(r => `Task ${r.id} result: ${JSON.stringify(r.result)}`).join('\n');

    const prompt = `You are a helpful AI assistant.
    The user's original goal was: "${goal}".
    
    The following tasks were successfully executed with their results:
    ${context}
    
    Based on these results, provide a comprehensive, well-formatted summary that directly addresses the user's original goal. Use Markdown for formatting if helpful (e.g., lists, bold text).`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};

export const performWebSearch = async (query: string): Promise<any> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Please perform a web search for: ${query}`,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const searchResults = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const summary = response.text;

    return `Search Summary: ${summary}\n\nSources: ${JSON.stringify(searchResults)}`;
};

export const performSummarization = async (text: string): Promise<string> => {
     const prompt = `Please summarize the following text: \n\n${text}`;
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
     });
     return response.text;
};

export const performGetLocationCoordinates = async (locationName: string): Promise<{ latitude: number; longitude: number }> => {
  const coordinateSchema = {
    type: Type.OBJECT,
    properties: {
      latitude: { type: Type.NUMBER },
      longitude: { type: Type.NUMBER },
    },
    required: ['latitude', 'longitude'],
  };
  
  const prompt = `Find the latitude and longitude for the following location: "${locationName}". Return only the JSON object with the coordinates.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: coordinateSchema,
    },
  });

  return JSON.parse(response.text);
};