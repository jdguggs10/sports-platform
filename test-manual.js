/**
 * Manual Test Script for Quick Sports Platform Testing
 * Run specific tests individually
 */

const BASE_URL = 'http://localhost:8081';

async function testBasicConversation() {
  console.log('🔄 Testing Basic Conversation Context...\n');

  // Message 1
  console.log('📤 Sending: "Hello! My name is John and I love baseball"');
  const response1 = await fetch(`${BASE_URL}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4',
      input: 'Hello! My name is John and I love baseball',
      memories: [
        { key: 'user_name', value: 'John' },
        { key: 'favorite_sport', value: 'baseball' }
      ],
      stream: false
    })
  });

  const data1 = await response1.json();
  console.log('📥 Response 1:', JSON.stringify(data1, null, 2));
  
  // Message 2 - with context
  console.log('\n📤 Sending: "Do you remember my name?" (with previous_response_id)');
  const response2 = await fetch(`${BASE_URL}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4',
      input: 'Do you remember my name?',
      previous_response_id: data1.id,
      stream: false
    })
  });

  const data2 = await response2.json();
  console.log('📥 Response 2:', JSON.stringify(data2, null, 2));
}

async function testMLBWithTools() {
  console.log('\n⚾ Testing MLB Stats with Tools...\n');

  const mlbTools = [
    {
      name: 'resolve_team',
      description: 'Resolve team name to team ID',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Team name' }
        }
      }
    }
  ];

  console.log('📤 Sending: "Tell me about the Yankees"');
  const response = await fetch(`${BASE_URL}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4',
      input: 'Tell me about the Yankees',
      tools: mlbTools,
      stream: false
    })
  });

  const data = await response.json();
  console.log('📥 Response:', JSON.stringify(data, null, 2));
}

async function testHockeyWithTools() {
  console.log('\n🏒 Testing Hockey Stats with Tools...\n');

  const hockeyTools = [
    {
      name: 'resolve_team',
      description: 'Resolve hockey team name to team ID',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Team name' }
        }
      }
    }
  ];

  console.log('📤 Sending: "Tell me about the Boston Bruins"');
  const response = await fetch(`${BASE_URL}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4',
      input: 'Tell me about the Boston Bruins',
      tools: hockeyTools,
      stream: false
    })
  });

  const data = await response.json();
  console.log('📥 Response:', JSON.stringify(data, null, 2));
}

async function testHealthCheck() {
  console.log('🏥 Testing Health Check...\n');
  
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();
  console.log('📥 Health:', JSON.stringify(data, null, 2));
}

// Manual test runner
async function runTest(testName) {
  try {
    switch (testName) {
      case 'health':
        await testHealthCheck();
        break;
      case 'conversation':
        await testBasicConversation();
        break;
      case 'mlb':
        await testMLBWithTools();
        break;
      case 'hockey':
        await testHockeyWithTools();
        break;
      case 'all':
        await testHealthCheck();
        await testBasicConversation();
        await testMLBWithTools();
        await testHockeyWithTools();
        break;
      default:
        console.log('Usage: node test-manual.js [health|conversation|mlb|hockey|all]');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Get test name from command line
const testName = process.argv[2] || 'health';
runTest(testName);