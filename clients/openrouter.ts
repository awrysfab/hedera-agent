import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

interface OpenRouterClientParams {
  modelName?: string;
  baseURL?: string;
  apiKey?: string;
  llmType?: 'openai' | 'anthropic';
}

function createInstance(params?: OpenRouterClientParams): ChatOpenAI | ChatAnthropic {
  let {
    modelName,
    baseURL,
    apiKey,
    llmType,
  } = params || {};
  modelName = modelName || process.env.OPENROUTER_MODEL;
  baseURL = baseURL || process.env.OPENROUTER_BASE_URL;
  apiKey = apiKey || process.env.OPENROUTER_API_KEY;
  llmType = llmType || modelName?.split('/')[0] as 'openai' | 'anthropic';

  console.log('openRouter createInstance', {
    modelName,
    baseURL,
    apiKey: apiKey?.substring(0, 12) + '...',
    llmType,
  });

  let llm: ChatOpenAI | ChatAnthropic;
  switch (llmType) {
    case 'openai':
      llm = new ChatOpenAI({
        model: modelName,
        apiKey: apiKey,
        maxTokens: 1000,
        temperature: 0.9,
        configuration: {
          baseURL,
        },
      });
      break;
    case 'anthropic':
      llm = new ChatAnthropic({
        model: modelName,
        apiKey: apiKey,
        maxTokens: 1000,
        temperature: 0.9,
        anthropicApiUrl: baseURL,
      });
      break;
    default:
      throw new Error(`Unsupported LLM type: ${llmType}`);
  }

  return llm;
}

export {
  createInstance,
  type OpenRouterClientParams,
}; 