import { performWebSearch, performSummarization } from './geminiService';

const executeWebSearch = async (args: { query: string }, dependencies: Record<string, any>) => {
  let query = args.query;
  // Replace placeholders like {{task1}} with actual results
  for (const depId in dependencies) {
    const placeholder = `{{${depId}}}`;
    if (query.includes(placeholder)) {
      query = query.replace(new RegExp(placeholder, 'g'), JSON.stringify(dependencies[depId]));
    }
  }
  return performWebSearch(query);
};

const executeSummarize = async (args: { query: string }, dependencies: Record<string, any>) => {
  let textToSummarize = args.query;
  // Replace placeholders like {{task1}} with actual results
  for (const depId in dependencies) {
    const placeholder = `{{${depId}}}`;
    if (textToSummarize.includes(placeholder)) {
        textToSummarize = textToSummarize.replace(new RegExp(placeholder, 'g'), JSON.stringify(dependencies[depId]));
    }
  }
  return performSummarization(textToSummarize);
};


const executeCalculation = async (args: { expression: string }, dependencies: Record<string, any>) => {
  let expression = args.expression;
  for (const depId in dependencies) {
      const placeholder = `{{${depId}}}`;
      if (expression.includes(placeholder)) {
          expression = expression.replace(new RegExp(placeholder, 'g'), JSON.stringify(dependencies[depId]));
      }
  }

  // Basic safe eval
  try {
    // A simple, safer way to evaluate math expressions without full `eval`
    const result = new Function(`return ${expression}`)();
    return `Calculation result for "${args.expression}" is: ${result}`;
  } catch (error) {
    throw new Error(`Invalid mathematical expression: ${expression}`);
  }
};

const executeGetWeather = async (args: { location: string }) => {
  const { location } = args;
  // This is a mock tool. In a real scenario, this would call a weather API.
  const mockWeatherData: Record<string, { tempC: number; condition: string }> = {
    'tokyo': { tempC: 25, condition: 'Sunny with some clouds' },
    'london': { tempC: 15, condition: 'Cloudy with a chance of rain' },
    'paris': { tempC: 18, condition: 'Partly cloudy' },
  };
  
  const lowerCaseLocation = location.toLowerCase();
  const foundCity = Object.keys(mockWeatherData).find(city => lowerCaseLocation.includes(city));

  if (foundCity) {
    const data = mockWeatherData[foundCity];
    const tempF = (data.tempC * 9/5) + 32;
    return `The weather in ${location} is ${data.condition} with a temperature of ${data.tempC}°C (${tempF.toFixed(1)}°F).`;
  }
  return `Could not find weather data for ${location}.`;
};


export const executeTool = async (
  toolName: 'webSearch' | 'calculate' | 'getWeather' | 'summarize',
  args: Record<string, any>,
  dependencies: Record<string, any>
): Promise<any> => {
  switch (toolName) {
    case 'webSearch':
      return executeWebSearch(args as { query: string }, dependencies);
    case 'calculate':
      return executeCalculation(args as { expression: string }, dependencies);
    case 'getWeather':
      return executeGetWeather(args as { location: string });
    case 'summarize':
      return executeSummarize(args as { query: string }, dependencies);
    default:
      throw new Error(`Tool "${toolName}" not found.`);
  }
};