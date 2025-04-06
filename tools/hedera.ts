import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { TopicCreateTransaction, TopicMessageSubmitTransaction, Client } from '@hashgraph/sdk';
import { createInstance } from '../clients/hedera';

const client: Client = createInstance();

interface HcsCreateTopicInput {
  memo: string;
}

interface HcsCreateTopicOutput {
  txId: string;
  topicId: string;
}

interface HcsSubmitTopicMessageInput {
  topicId: string;
  message: string;
}

interface HcsSubmitTopicMessageOutput {
  txId: string;
  topicSequenceNumber: number;
}

/* CMD_HCS_CREATE_TOPIC */

const commandHcsCreateTopicDef = {
  name: 'CMD_HCS_CREATE_TOPIC',
  description: 'create a new HCS Topic',
  schema: z.object({
    memo: z
      .string()
      .describe('a memo for the topic with'),
  }),
};

async function commandHcsCreateTopicImpl(inputs: HcsCreateTopicInput): Promise<HcsCreateTopicOutput> {
  console.log('CMD_HCS_CREATE_TOPIC invoked with inputs:', inputs);

  const { memo } = inputs;

  const tx = await new TopicCreateTransaction()
    .setTopicMemo(memo)
    .freezeWith(client);

  const txId = tx.transactionId;
  if (!txId) {
    throw new Error('Transaction ID is null');
  }

  const txSigned = await tx.signWithOperator(client);
  const txSubmitted = await txSigned.execute(client);
  const txReceipt = await txSubmitted.getReceipt(client);

  const topicId = txReceipt.topicId;
  if (!topicId) {
    throw new Error('Topic ID is null');
  }

  return {
    txId: txId.toString(),
    topicId: topicId.toStringWithChecksum(client),
  };
}

const commandHcsCreateTopicTool = tool(commandHcsCreateTopicImpl, commandHcsCreateTopicDef);

/* CMD_HCS_SUBMIT_TOPIC_MESSAGE */

const commandHcsSubmitTopicMessageDef = {
  name: 'CMD_HCS_SUBMIT_TOPIC_MESSAGE',
  description: 'submit a message to an existing HCS topic',
  schema: z.object({
    topicId: z
      .string()
      .describe('the ID of the HCS topic to submit a message to'),
    message: z
      .string()
      .describe('the text of the message to submit'),
  }),
};

async function commandHcsSubmitTopicMessageImpl(inputs: HcsSubmitTopicMessageInput): Promise<HcsSubmitTopicMessageOutput> {
  console.log('CMD_HCS_SUBMIT_TOPIC_MESSAGE invoked with inputs:', inputs);

  const { topicId, message } = inputs;

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .freezeWith(client);

  const txId = tx.transactionId;
  if (!txId) {
    throw new Error('Transaction ID is null');
  }

  const txSigned = await tx.signWithOperator(client);
  const txSubmitted = await txSigned.execute(client);
  const txReceipt = await txSubmitted.getReceipt(client);

  const topicSequenceNumber = txReceipt.topicSequenceNumber;
  if (topicSequenceNumber === null) {
    throw new Error('Topic sequence number is null');
  }

  return {
    txId: txId.toString(),
    topicSequenceNumber: Number(topicSequenceNumber),
  };
}

const commandHcsSubmitTopicMessageTool = tool(commandHcsSubmitTopicMessageImpl, commandHcsSubmitTopicMessageDef);

const allHederaTools = [
  commandHcsCreateTopicTool,
  commandHcsSubmitTopicMessageTool,
];

export {
  commandHcsCreateTopicTool,
  commandHcsSubmitTopicMessageTool,
  allHederaTools,
};
