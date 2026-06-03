import { APIProvider, ProviderHealth } from './types';

/**
 * Monitors provider health and implements circuit breaker pattern
 */
export class HealthMonitor {
  private healthMetrics: Map<string, ProviderHealth> = new Map();
  private errorThreshold: number;
  private checkInterval: number = 60000; // 1 minute

  constructor(errorThreshold: number = 5) {
    this.errorThreshold = errorThreshold;
  }

  /**
   * Record successful request
   */
  public recordSuccess(provider: APIProvider, responseTime: number): void {
    provider.successCount++;
    const health = this.getOrCreateHealth(provider.name);
    health.averageLatency = this.calculateAverage(health.averageLatency, responseTime);
    health.uptime = this.calculateUptime(provider);
    health.lastChecked = new Date();
  }

  /**
   * Record failed request
   */
  public recordError(provider: APIProvider): void {
    provider.errorCount++;

    // Circuit breaker: disable if error threshold exceeded
    if (provider.errorCount >= this.errorThreshold) {
      provider.status = 'error';
    }

    const health = this.getOrCreateHealth(provider.name);
    health.status = this.determineStatus(provider);
    health.lastChecked = new Date();
  }

  /**
   * Get provider health status
   */
  public getHealth(providerName: string): ProviderHealth | null {
    return this.healthMetrics.get(providerName) || null;
  }

  /**
   * Get all provider health statuses
   */
  public getAllHealth(): ProviderHealth[] {
    return Array.from(this.healthMetrics.values());
  }

  /**
   * Determine provider health status
   */
  private determineStatus(provider: APIProvider): 'healthy' | 'degraded' | 'unhealthy' {
    const total = provider.successCount + provider.errorCount;
    if (total === 0) return 'healthy';

    const errorRate = provider.errorCount / total;

    if (errorRate > 0.5) {
      return 'unhealthy';
    } else if (errorRate > 0.2) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Calculate uptime percentage
   */
  private calculateUptime(provider: APIProvider): number {
    const total = provider.successCount + provider.errorCount;
    if (total === 0) return 100;
    return (provider.successCount / total) * 100;
  }

  /**
   * Calculate average response time
   */
  private calculateAverage(current: number, newValue: number): number {
    if (current === 0) return newValue;
    return (current + newValue) / 2;
  }

  /**
   * Get or create health record
   */
  private getOrCreateHealth(providerName: string): ProviderHealth {
    let health = this.healthMetrics.get(providerName);
    if (!health) {
      health = {
        providerId: providerName,
        status: 'healthy',
        lastChecked: new Date(),
        uptime: 100,
        averageLatency: 0,
      };
      this.healthMetrics.set(providerName, health);
    }
    return health;
  }

  /**
   * Reset error count (for circuit breaker reset)
   */
  public resetErrorCount(provider: APIProvider): void {
    provider.errorCount = 0;
    provider.status = 'active';
  }
}
