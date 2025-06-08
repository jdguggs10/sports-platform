/**
 * Local test script for hockey-stats-mcp
 */

const BASE_URL = 'http://localhost:8783';

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n🏒 Testing ${name}...`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name} - Status: ${response.status}`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ ${name} - Status: ${response.status}`);
      console.log(data);
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Testing Hockey Stats MCP v3\n');
  
  // Health check
  await testEndpoint('Health Check', `${BASE_URL}/health`);
  
  // Team lookup - Boston Bruins
  await testEndpoint('Team Lookup - Bruins', `${BASE_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: 'team',
      query: { name: 'Boston Bruins' }
    })
  });
  
  // Player lookup - Connor McDavid
  await testEndpoint('Player Lookup - McDavid', `${BASE_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: 'player',
      query: { name: 'Connor McDavid' }
    })
  });
  
  // Standings
  await testEndpoint('Current Standings', `${BASE_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: 'standings',
      query: {}
    })
  });
  
  console.log('\n🏁 Test completed!');
}

runTests().catch(console.error);