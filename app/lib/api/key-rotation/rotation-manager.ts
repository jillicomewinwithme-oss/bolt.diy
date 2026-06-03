import { APIProvider, KeyRotationConfig, RotationResult, RotationStrategy } from './types';

/**
 * Manages API key rotation across multiple LLM providers
 * Prevents rate limiting by distributing requests across providers
 */
export class RotationManager {
  private config: KeyRotationConfig;
  private currentIndex: number = 0;
  private requestCounts: Map<string, number> = new Map();
  private lastRotationTime: Map<string, number> = new Map();

  constructor(config: KeyRotationConfig) {
    this.config = config;
    this.initializeMetrics();
  }

  /**
   * Get next provider based on rotation strategy
   */
  public getNextProvider(): RotationResult {
    const provider = this.selectProvider();
    const apiKey = process.env[provider.apiKeyEnvVar] || '';

    if (!apiKey) {
      throw new Error(`API key not found for provider: ${provider.name}`);
    }

    this.recordUsage(provider.name);

    return {
      provider,
      apiKey,
      baseUrl: provider.baseUrl,
    };
  }

  /**
   * Select provider based on configured strategy
   */
  private selectProvider(): APIProvider {
    const activeProviders = this.config.providers.filter((p) => p.status === 'active');

    if (activeProviders.length === 0) {
      throw new Error('No active providers available');
    }

    switch (this.config.strategy.type) {
      case 'round-robin':
        return this.roundRobinSelect(activeProviders);
      case 'least-used':
        return this.leastUsedSelect(activeProviders);
      case 'random':
        return this.randomSelect(activeProviders);
      case 'priority':
        return this.prioritySelect(activeProviders);
      default:
        return activeProviders[0];
    }
  }

  /**
   * Round-robin selection strategy
   */
  private roundRobinSelect(providers: APIProvider[]): APIProvider {
    const provider = providers[this.currentIndex % providers.length];
    this.currentIndex++;
    return provider;
  }

  /**
   * Least-used selection strategy - picks provider with fewest requests
   */
  private leastUsedSelect(providers: APIProvider[]): APIProvider {
    return providers.reduce((prev, current) => {
      const prevCount = this.requestCounts.get(prev.name) || 0;
      const currentCount = this.requestCounts.get(current.name) || 0;
      return currentCount < prevCount ? current : prev;
    });
  }

  /**
   * Random selection strategy
   */
  private randomSelect(providers: APIProvider[]): APIProvider {
    return providers[Math.floor(Math.random() * providers.length)];
  }

  /**
   * Priority-based selection strategy
   */
  private prioritySelect(providers: APIProvider[]): APIProvider {
    if (!this.config.strategy.priority || this.config.strategy.priority.length === 0) {
      return providers[0];
    }

    for (const providerName of this.config.strategy.priority) {
      const provider = providers.find((p) => p.name === providerName);
      if (provider) {
        return provider;
      }
    }

    return providers[0];
  }

  /**
   * Record provider usage
   */
  private recordUsage(providerName: string): void {
    const current = this.requestCounts.get(providerName) || 0;
    this.requestCounts.set(providerName, current + 1);
    this.lastRotationTime.set(providerName, Date.now());
  }

  /**
   * Initialize metrics for all providers
   */
  private initializeMetrics(): void {
    this.config.providers.forEach((provider) => {
      this.requestCounts.set(provider.name, 0);
      this.lastRotationTime.set(provider.name, 0);
    });
  }

  /**
   * Get current metrics
   */
  public getMetrics() {
    return Object.fromEntries(this.requestCounts);
  }

  /**
   * Reset usage counts
   */
  public resetMetrics(): void {
    this.requestCounts.clear();
    this.lastRotationTime.clear();
    this.initializeMetrics();
  }

  /**
   * Update provider status
   */
  public updateProviderStatus(providerName: string, status: 'active' | 'inactive' | 'error'): void {
    const provider = this.config.providers.find((p) => p.name === providerName);
    if (provider) {
      provider.status = status;
    }
  }
}
