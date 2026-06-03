import { UsageMetrics, RequestMetadata } from './types';

/**
 * Collects and analyzes usage metrics for API providers
 */
export class MetricsCollector {
  private metrics: Map<string, UsageMetrics> = new Map();
  private requestHistory: RequestMetadata[] = [];
  private maxHistorySize: number = 10000;

  /**
   * Record request completion
   */
  public recordRequest(metadata: RequestMetadata): void {
    this.requestHistory.push(metadata);

    // Keep history size manageable
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }

    this.updateMetrics(metadata);
  }

  /**
   * Get metrics for specific provider
   */
  public getMetrics(providerId: string): UsageMetrics | null {
    return this.metrics.get(providerId) || null;
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): UsageMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get aggregated statistics
   */
  public getStatistics(providerId?: string) {
    const requests = providerId
      ? this.requestHistory.filter((r) => r.provider === providerId)
      : this.requestHistory;

    if (requests.length === 0) {
      return null;
    }

    const successful = requests.filter((r) => r.success).length;
    const failed = requests.length - successful;
    const avgDuration = requests.reduce((sum, r) => sum + r.duration, 0) / requests.length;
    const totalTokens = requests.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);

    return {
      totalRequests: requests.length,
      successfulRequests: successful,
      failedRequests: failed,
      successRate: (successful / requests.length) * 100,
      averageDuration: avgDuration,
      totalTokensUsed: totalTokens,
      requestsPerHour: this.calculateRequestsPerHour(requests),
    };
  }

  /**
   * Update metrics
   */
  private updateMetrics(metadata: RequestMetadata): void {
    const existing = this.metrics.get(metadata.provider) || this.createEmptyMetrics(metadata.provider);

    existing.requestCount++;
    if (metadata.success) {
      existing.successCount++;
    } else {
      existing.errorCount++;
    }

    existing.tokenCount += metadata.tokensUsed || 0;
    existing.averageResponseTime = this.calculateAverage(existing.averageResponseTime, metadata.duration);
    existing.timestamp = new Date();

    this.metrics.set(metadata.provider, existing);
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(providerId: string): UsageMetrics {
    return {
      providerId,
      timestamp: new Date(),
      requestCount: 0,
      tokenCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * Calculate average
   */
  private calculateAverage(current: number, newValue: number): number {
    if (current === 0) return newValue;
    return (current + newValue) / 2;
  }

  /**
   * Calculate requests per hour
   */
  private calculateRequestsPerHour(requests: RequestMetadata[]): number {
    if (requests.length === 0) return 0;

    const now = new Date().getTime();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentRequests = requests.filter((r) => r.timestamp.getTime() > oneHourAgo);

    return recentRequests.length;
  }

  /**
   * Export metrics to JSON
   */
  public exportMetrics() {
    return {
      timestamp: new Date(),
      metrics: this.getAllMetrics(),
      statistics: this.getStatistics(),
    };
  }

  /**
   * Clear metrics
   */
  public clearMetrics(): void {
    this.metrics.clear();
    this.requestHistory = [];
  }
}
