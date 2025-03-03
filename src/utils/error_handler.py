from loguru import logger
import sys
import traceback

# Configure logger
logger.add(
    "logs/error.log",
    rotation="500 MB",
    retention="10 days",
    level="ERROR",
    backtrace=True,
    diagnose=True
)

class ErrorHandler:
    @staticmethod
    def handle_error(error, context=""):
        """Handle and log errors with context"""
        error_type = type(error).__name__
        error_message = str(error)
        stack_trace = traceback.format_exc()
        
        error_data = {
            "type": error_type,
            "message": error_message,
            "context": context,
            "stack_trace": stack_trace
        }
        
        logger.error(f"Error in {context}: {error_message}\n{stack_trace}")
        return error_data
    
    @staticmethod
    def format_error_response(error_data):
        """Format error data for API response"""
        return {
            "success": False,
            "error": {
                "type": error_data["type"],
                "message": error_data["message"],
                "context": error_data["context"]
            }
        }