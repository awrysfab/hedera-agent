#!/usr/bin/env node

import * as readline from 'node:readline/promises';
import * as process from 'node:process';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage, MessageContent } from '@langchain/core/messages';
import { commandHcsCreateTopicTool, commandHcsSubmitTopicMessageTool } from './tools/hedera';
import { createInstance } from './clients/openrouter';

const llm = createInstance();
const tools = [commandHcsCreateTopicTool, commandHcsSubmitTopicMessageTool];
const checkpointSaver = new MemorySaver();
const agent = createReactAgent({
  llm,
  tools,
  checkpointSaver,
});

const rlp = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function readUserPrompt(): Promise<string> {
  const lines: string[] = [];
  while (true) {
    const line = await rlp.question('');
    if (line === '') {
      return lines.join('\n');
    }
    lines.push(line);
  }
}

interface AgentReply {
  messages: (HumanMessage | AIMessage)[];
}

function getMessageContent(content: MessageContent): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map(item => {
      if (typeof item === 'string') {
        return item;
      }
      if ('text' in item) {
        return item.text;
      }
      return JSON.stringify(item);
    }).join('\n');
  }
  return JSON.stringify(content);
}

async function obtainAgentReply(userPrompt: string): Promise<string> {
  const reply = await agent.invoke(
    {
      messages: [new HumanMessage(userPrompt)],
    },
    {
      configurable: { thread_id: '0x0001' },
    },
  ) as AgentReply;

  const lastMessage = reply.messages[reply.messages.length - 1];
  return getMessageContent(lastMessage.content);
}

async function main() {
  while (true) {
    console.log('You:\n');
    const userPrompt = await readUserPrompt();
    console.log('userPrompt:', userPrompt);

    console.log('Agent:\n');
    const agentReply = await obtainAgentReply(userPrompt);
    console.log('agentReply:', agentReply);
  }
}

main().catch((error) => {
  console.error('An error occurred:', error);
  process.exit(1);
});
