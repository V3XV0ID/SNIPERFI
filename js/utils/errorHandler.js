export const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    // Log to file if needed
    logToFile(error, context);
    
    return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        context: context,
        timestamp: new Date().toISOString()
    };
};

const logToFile = (error, context) => {
    // TODO: Implement file logging if needed
    console.warn(`[${new Date().toISOString()}] ${context}: ${error.message}`);
};