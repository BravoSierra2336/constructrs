import './config/env.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const OpenAI = require('openai');

console.log('Testing OpenAI connection...');
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10) || 'N/A');

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

async function testOpenAI() {
  try {
    console.log('Making test API call...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say hello in one word' }
      ],
      max_tokens: 5
    });
    
    console.log('✅ OpenAI API call successful!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.log('❌ OpenAI API call failed:');
    console.log('Error status:', error.status || 'Unknown');
    console.log('Error code:', error.code || 'Unknown');
    console.log('Error message:', error.message);
    
    if (error.status === 401) {
      console.log('🔑 API key is invalid or expired');
    } else if (error.status === 429) {
      console.log('⏱️ Rate limit exceeded');
    } else if (error.status === 402) {
      console.log('💳 Billing/quota issue');
    }
  }
}

testOpenAI();
