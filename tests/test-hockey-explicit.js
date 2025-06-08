/**
 * Explicit Hockey Test
 */

const BASE_URL = 'http://localhost:8081';

async function testHockeyExplicit() {
  console.log('🏒 Testing Hockey with Explicit Tools and Context...\n');

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

  console.log('📤 Sending: "Tell me about the Bruins hockey team"');
  const response = await fetch(`${BASE_URL}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4',
      input: 'Tell me about the Bruins hockey team',
      tools: hockeyTools,
      memories: [
        { key: 'user_sport', value: 'hockey' },
        { key: 'context', value: 'NHL hockey data request' }
      ],
      stream: false
    })
  });

  const data = await response.json();
  console.log('📥 Response:', JSON.stringify(data, null, 2));
}

testHockeyExplicit().catch(console.error);