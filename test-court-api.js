const axios = require('axios');

async function testCourtAPI() {
  try {
    console.log('🧪 Testing New Court API Implementation...');
    
    // Test 1: Phoenix States lookup
    console.log('\n📋 Test 1: Phoenix States Lookup');
    const statesResponse = await axios.get('http://localhost:3000/api/ecourts/court-api?action=phoenix&type=states');
    console.log('✅ States Response:', statesResponse.status);
    console.log('📊 States Data:', JSON.stringify(statesResponse.data, null, 2));
    
    // Test 2: Advanced Search - Advocate Name
    console.log('\n📋 Test 2: Advanced Search - Advocate Name');
    const advocateResponse = await axios.post('http://localhost:3000/api/ecourts/court-api', {
      action: 'search',
      mode: 'advocateName',
      advocateName: 'Test Advocate',
      stateCode: 'KAR'
    });
    console.log('✅ Advocate Search Response:', advocateResponse.status);
    console.log('📊 Advocate Search Data:', JSON.stringify(advocateResponse.data, null, 2));
    
    // Test 3: Advanced Search - Party Name
    console.log('\n📋 Test 3: Advanced Search - Party Name');
    const partyResponse = await axios.post('http://localhost:3000/api/ecourts/court-api', {
      action: 'search',
      mode: 'partyName',
      partyName: 'Test Party',
      stateCode: 'KAR'
    });
    console.log('✅ Party Search Response:', partyResponse.status);
    console.log('📊 Party Search Data:', JSON.stringify(partyResponse.data, null, 2));
    
    // Test 4: CNR Search
    console.log('\n📋 Test 4: CNR Search');
    const cnrResponse = await axios.post('http://localhost:3000/api/ecourts/court-api', {
      action: 'cnr',
      cnr: '1234567890123456'
    });
    console.log('✅ CNR Search Response:', cnrResponse.status);
    console.log('📊 CNR Search Data:', JSON.stringify(cnrResponse.data, null, 2));
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCourtAPI();














