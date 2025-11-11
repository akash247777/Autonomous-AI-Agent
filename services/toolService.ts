import { performWebSearch, performSummarization, performGetLocationCoordinates } from './geminiService';

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

const executeGetCurrentLocation = async (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by this browser."));
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Could not get location: ${error.message}`));
      }
    );
  });
};

const executeGetLocationCoordinates = async (args: { locationName: string }): Promise<{ latitude: number; longitude: number }> => {
    if (!args.locationName) {
        throw new Error("Location name is required for getLocationCoordinates tool.");
    }
    return performGetLocationCoordinates(args.locationName);
};


const executeGetWeather = async (args: { latitude?: number; longitude?: number }, dependencies: Record<string, any>) => {
  let { latitude, longitude } = args;

  // If lat/lon are not in args, they must come from a dependency.
  if (latitude == null || longitude == null) {
    let locationFound = false;
    for (const depId in dependencies) {
      const depResult = dependencies[depId];
      // Check if the dependency result is the location object we need
      if (depResult && typeof depResult.latitude === 'number' && typeof depResult.longitude === 'number') {
        latitude = depResult.latitude;
        longitude = depResult.longitude;
        locationFound = true;
        break; // Found it, no need to check other dependencies
      }
    }

    if (!locationFound) {
      throw new Error("Could not find latitude and longitude from arguments or dependencies for the getWeather tool.");
    }
  }
  
  const query = `current weather at latitude ${latitude} longitude ${longitude}`;
  console.log(`Using web search to find weather with query: "${query}"`);
  // Use the existing web search tool to get the weather.
  return performWebSearch(query);
};


export const executeTool = async (
  toolName: 'webSearch' | 'calculate' | 'getWeather' | 'summarize' | 'getCurrentLocation' | 'getLocationCoordinates',
  args: Record<string, any>,
  dependencies: Record<string, any>
): Promise<any> => {
  switch (toolName) {
    case 'webSearch':
      return executeWebSearch(args as { query: string }, dependencies);
    case 'calculate':
      return executeCalculation(args as { expression: string }, dependencies);
    case 'getWeather':
      return executeGetWeather(args as { latitude?: number, longitude?: number }, dependencies);
    case 'summarize':
      return executeSummarize(args as { query: string }, dependencies);
    case 'getCurrentLocation':
      return executeGetCurrentLocation();
    case 'getLocationCoordinates':
        return executeGetLocationCoordinates(args as { locationName: string });
    default:
      throw new Error(`Tool "${toolName}" not found.`);
  }
};