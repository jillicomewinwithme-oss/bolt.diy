# API Key Rotation System

Bolt.diy includes an automatic API key rotation system that helps distribute load across multiple free LLM providers to prevent rate limiting and maximize availability.

## Features

- **Multi-Provider Support**: Rotate between Groq, OpenRouter, Cerebras, Hugging Face, Mistral, Cohere, and Google Gemini
- **Smart Rotation Strategies**: Round-robin, least-used, random, or priority-based selection
- **Health Monitoring**: Automatic provider health tracking with circuit breaker pattern
- **Metrics Collection**: Detailed usage analytics and performance tracking
- **Automatic Failover**: Seamlessly switches to healthy providers when one fails

## Setup

### 1. Copy Configuration Template

```bash
cp .env.rotation.example .env.local
```

### 2. Add Your API Keys

Edit `.env.local` and add API keys for providers you have access to:

```env
# At least one key is required
GROQ_API_KEY=your_groq_key_here
OPEN_ROUTER_API_KEY=your_openrouter_key_here
CEREBRAS_API_KEY=your_cerebras_key_here
```

### 3. Configure Rotation Strategy

```env
# Choose rotation strategy
VITE_ROTATION_STRATEGY=least-used  # or: round-robin, random, priority

# For priority strategy, specify order
VITE_ROTATION_PRIORITY=Groq,OpenRouter,Cerebras
```

## Rotation Strategies

### Round-Robin
Cycles through providers in order.
```env
VITE_ROTATION_STRATEGY=round-robin
```

### Least-Used (Recommended)
Selects the provider with the fewest requests, balancing load.
```env
VITE_ROTATION_STRATEGY=least-used
```

### Random
Randomly selects a provider.
```env
VITE_ROTATION_STRATEGY=random
```

### Priority
Uses providers in priority order, falling back if one fails.
```env
VITE_ROTATION_STRATEGY=priority
VITE_ROTATION_PRIORITY=Groq,OpenRouter,Cerebras
```

## Supported Providers

| Provider | Free Tier | Models | Setup |
|----------|-----------|--------|-------|
| **Groq** | 30 RPM, 14.4K RPD | Llama 3.3-70b, DeepSeek, Qwen | [Get Key](https://console.groq.com/keys) |
| **OpenRouter** | 20 RPM, 200 RPD | 35+ free models | [Get Key](https://openrouter.ai/keys) |
| **Cerebras** | 30 RPM, 1M TPD | Llama, GPT-OSS, Qwen | [Get Key](https://cloud.cerebras.ai/settings) |
| **Hugging Face** | $0.10/mo free | Thousands of models | [Get Key](https://huggingface.co/settings/tokens) |
| **Mistral** | ~1B tokens/mo | Mistral Small/Medium/Large | [Get Key](https://console.mistral.ai/api-keys/) |
| **Cohere** | 1K calls/month | Command models | [Get Key](https://dashboard.cohere.ai/api-keys) |
| **Google Gemini** | 10 RPM, 250 RPD | Gemini 2.5 Flash | [Get Key](https://makersuite.google.com/app/apikey) |

## Usage in Code

### Basic Usage

```typescript
import { RotationManager, MetricsCollector, HealthMonitor } from '@/lib/api/key-rotation';
import { FREE_LLM_PROVIDERS } from '@/lib/api/key-rotation/providers-config';

const config = {
  enabled: true,
  strategy: { type: 'least-used' as const },
  providers: FREE_LLM_PROVIDERS,
  retryAttempts: 3,
  circuitBreakerThreshold: 5,
};

const rotationManager = new RotationManager(config);
const healthMonitor = new HealthMonitor();
const metricsCollector = new MetricsCollector();

// Get next provider
const { provider, apiKey, baseUrl } = rotationManager.getNextProvider();

// Use the provider...
try {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    // ... request body
  });

  const duration = Date.now() - startTime;
  
  if (response.ok) {
    healthMonitor.recordSuccess(provider, duration);
  } else {
    healthMonitor.recordError(provider);
  }

  metricsCollector.recordRequest({
    model: 'your-model',
    provider: provider.name,
    timestamp: new Date(),
    duration,
    success: response.ok,
    tokensUsed: tokens,
  });
} catch (error) {
  healthMonitor.recordError(provider);
}
```

### Custom Providers

```typescript
import { APIProvider } from '@/lib/api/key-rotation';

const customProviders: APIProvider[] = [
  {
    name: 'MyCustomProvider',
    baseUrl: 'https://api.example.com/v1',
    apiKeyEnvVar: 'MY_CUSTOM_API_KEY',
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 10000,
    },
    models: ['model-1', 'model-2'],
    status: 'active',
    errorCount: 0,
    successCount: 0,
  },
];

const manager = new RotationManager({
  enabled: true,
  strategy: { type: 'round-robin' },
  providers: [...FREE_LLM_PROVIDERS, ...customProviders],
  retryAttempts: 3,
  circuitBreakerThreshold: 5,
});
```

## Monitoring

### View Metrics

```typescript
const metrics = metricsCollector.getAllMetrics();
const stats = metricsCollector.getStatistics();

console.log('Metrics:', metrics);
console.log('Statistics:', stats);
```

### Check Provider Health

```typescript
const allHealth = healthMonitor.getAllHealth();
allHealth.forEach(health => {
  console.log(`${health.providerId}: ${health.status} (${health.uptime.toFixed(1)}% uptime)`);
});
```

### Export Metrics

```typescript
const exportedMetrics = metricsCollector.exportMetrics();
console.log(JSON.stringify(exportedMetrics, null, 2));
```

## Circuit Breaker

The system automatically disables providers that exceed the error threshold:

```env
# Provider will be disabled after 5 consecutive errors
VITE_CIRCUIT_BREAKER_THRESHOLD=5
```

Disabled providers are skipped during rotation until manually re-enabled.

## Best Practices

1. **Use Least-Used Strategy**: Distributes load evenly across providers
2. **Set Priority Order**: Primary provider first, fallbacks in order
3. **Monitor Health**: Check metrics regularly for provider status
4. **Add Multiple Keys**: More providers = better availability
5. **Adjust Thresholds**: Based on your error patterns

## Troubleshooting

### No providers available

Check that at least one API key is configured in `.env.local`.

### Rate limiting errors

- Add more provider keys
- Use `least-used` strategy
- Increase `VITE_CIRCUIT_BREAKER_THRESHOLD`

### Poor performance

Check metrics to identify slow providers:

```typescript
const stats = metricsCollector.getStatistics();
if (stats.averageDuration > 5000) {
  console.log('Slow provider detected');
}
```

## References

- [awesome-free-llm-apis](https://github.com/jillicomewinwithme-oss/awesome-free-llm-apis)
- [public-apis](https://github.com/jillicomewinwithme-oss/public-apis)
