/**
 * Structured error class for the SVOS application.
 * Allows for consistent error handling and reporting across engines and APIs.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    severity: AppError['severity'] = 'MEDIUM',
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.severity = severity;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specifically for AI-related failures
 */
export class AIError extends AppError {
  constructor(message: string, severity: AppError['severity'] = 'MEDIUM') {
    super(message, 'AI_ENGINE_ERROR', 502, severity);
  }
}

/**
 * Specifically for Google Cloud service failures (Maps, Vertex)
 */
export class CloudServiceError extends AppError {
  constructor(message: string, service: string) {
    super(`Cloud Service Error [${service}]: ${message}`, 'CLOUD_SERVICE_ERROR', 503, 'HIGH');
  }
}
