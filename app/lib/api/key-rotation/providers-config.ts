import { APIProvider } from './types';

/**
 * Configuration for free LLM API providers
 * Data sourced from awesome-free-llm-apis and public-apis repositories
 */

export const FREE_LLM_PROVIDERS: APIProvider[] = [
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnvVar: 'GROQ_API_KEY',
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerDay: 14400,
      tokensPerMinute: undefined,
      tokensPerDay: undefined,
    },
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama-4-scout-17b-16e-instruct',
      'qwen3-32b',
      'deepseek-r1-distill-70b',
    ],
    status: 'active',
    errorCount: 0,
    successCount: 0,
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnvVar: 'OPEN_ROUTER_API_KEY',
    rateLimit: {
      requestsPerMinute: 20,
      requestsPerDay: 200,
      tokensPerMinute: undefined,
      tokensPerDay: undefined,
    },
    models: [
      'deepseek/deepseek-r1-0528:free',
      'deepseek/deepseek-chat-v3-0324:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'mistralai/devstral-2512:free',
    ],
    status: 'active',
    errorCount: 0,
    successCount: 0,
  },
  {
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    apiKeyEnvVar: 'CEREBRAS_API_KEY',
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerDay: 14400,
      tokensPerDay: 1000000,
    },
    models: ['llama3.1-8b', 'gpt-oss-120b', 'qwen-3-235b-a22b-instruct-2507'],
    status: 'active',
    errorCount: 0,
    successCount: 0,
  },
  {
    name: 'Hugging Face',
    baseUrl: 'https://api-inference.huggingface.co/models',
    apiKeyEnvVar: 'HuggingFace_API_KEY',
    rateLimit: {
      requestsPerMinute: 1000,
      requestsPerDay: 1000000,
    },
    models: [
      'meta-llama/Meta-Llama-3.1-8B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3',
      'mixtral/Mixtral-8x7B-Instruct-v0.1',
    ],
    status: 'active',
    errorCount: 0,
    successCount: 0,
  },
  {
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKeyEnvVar: 'MISTRAL_API_KEY',
    rateLimit: {
      requestsPerMinute: 1,
      requestsPerDay: 1000000,
      tokensPerMinute: 500000,
    },
    models: ['mistral-small-4', 'mistral-medium-3', 'mistral-large-3', 'mistral-nemo'],
    status: 'active',
    errorCount: 0,
    successCount: 0,
  },
  {
    name: 'Cohere',
    baseUrl: 'https://api.cohere.com/v2',
    apiKeyEnvVar: 'COHERE_API_KEY',
    rateLimit: {
      requestsPerMinute: 20,
      requestsPerDay: 1000,
    },
    models: ['command-a-111b', 'command-r-plus', 'command-r', 'command-r7b'],
    status: 'active',
    errorCount: 0,
    successCount: 0,
  },
  {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnvVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerDay: 250,
    },
    models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    status: 'active',
    errorCount: 0,
    successCount: 0,
  },
];

/**
 * Get provider by name
 */
export function getProviderByName(name: string): APIProvider | undefined {
  return FREE_LLM_PROVIDERS.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get providers that support a specific model
 */
export function getProvidersForModel(model: string): APIProvider[] {
  return FREE_LLM_PROVIDERS.filter((p) => p.models.some((m) => m.includes(model)));
}

/**
 * Get active providers
 */
export function getActiveProviders(): APIProvider[] {
  return FREE_LLM_PROVIDERS.filter((p) => p.status === 'active');
}
