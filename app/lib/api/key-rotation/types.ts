/**
 * API Key Rotation System Types
 * Handles rotation across multiple free LLM APIs to prevent rate limiting
 */

export interface APIProvider {
  name: string;
  baseUrl: string;
  apiKeyEnvVar: string;
  rateLimit: RateLimit;
  models: string[];
  status: 'active' | 'inactive' | 'error';
  lastUsed?: Date;
  errorCount: number;
  successCount: number;
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerDay: number;
  tokensPerMinute?: number;
  tokensPerDay?: number;
}

export interface RotationStrategy {
  type: 'round-robin' | 'least-used' | 'random' | 'priority';
  priority?: string[]; // Provider names in priority order
}

export interface KeyRotationConfig {
  enabled: boolean;
  strategy: RotationStrategy;
  providers: APIProvider[];
  fallbackProvider?: string;
  retryAttempts: number;
  circuitBreakerThreshold: number; // Error threshold before disabling provider
}

export interface UsageMetrics {
  providerId: string;
  timestamp: Date;
  requestCount: number;
  tokenCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
}

export interface ProviderHealth {
  providerId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: Date;
  uptime: number; // Percentage
  averageLatency: number; // ms
}

export interface RotationResult {
  provider: APIProvider;
  apiKey: string;
  baseUrl: string;
}

export interface RequestMetadata {
  model: string;
  provider: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  errorMessage?: string;
  tokensUsed?: number;
}
