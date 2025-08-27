// Import the Pinecone library
const { Pinecone } = require("@pinecone-database/pinecone");
// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINE_CONE_API_KEY });

// Create a dense index with integrated embedding
const chatGPTIndex = pc.index("gptlikagent");

async function createMemonry({ vectores, messageId, metadata }) {
  await chatGPTIndex.upsert([
    {
      id: messageId,
      values: vectores,
      metadata,
    },
  ]);
}

async function queryMemory({ queryVector, limit = 5, metadata }) {
  const data = await chatGPTIndex.query({
    vector: queryVector,
    topK: limit,
    filter: metadata ? { metadata } : undefined,
    includeMetadata: true,
  });
  return data.matches;
}

module.exports = {
  createMemonry,
  queryMemory,
};
