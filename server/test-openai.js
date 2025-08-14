import './config/env.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const OpenAI = require('openai');

console.log('Testing OpenAI with maxTokens parameter...');

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

async function testMaxTokensParameter() {
  try {
    console.log('Making test API call with maxTokens parameter...');
    
    // This should fail with "400 Unrecognized request argument"
    const badParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 5,
      maxTokens: 5  // This is the problem - invalid parameter
    };
    
    console.log('❌ Testing with BOTH max_tokens and maxTokens (should fail):');
    try {
      await openai.chat.completions.create(badParams);
    } catch (error) {
      console.log('✅ Expected error:', error.message);
    }
    
    // This should work
    const goodParams = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 5  // Only correct parameter
    };
    
    console.log('✅ Testing with only max_tokens (should work):');
    const response = await openai.chat.completions.create(goodParams);
    console.log('Response:', response.choices[0].message.content);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testMaxTokensParameter();
