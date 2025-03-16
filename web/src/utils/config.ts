/**
 * Configuration utilities for the application
 */

/**
 * Get the base API URL for backend requests
 * @returns The base API URL
 */
export function getApiUrl(): string {
  // For development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080/api';
  }
  
  // For production, use the deployed API URL
  return '/api';
}
