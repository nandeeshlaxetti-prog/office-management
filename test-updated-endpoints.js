const axios = require('axios');

async function testUpdatedEndpoints() {
  try {
    console.log('🧪 Testing Updated API Endpoints...');
    
    // Test advocate number search with the updated endpoints
    const response = await axios.post('http://localhost:3000/api/ecourts/advocate', {
      searchType: 'number',
      courtType: 'district',
      advocateNumber: '2271',
      state: 'KAR',
      year: '2021',
      complex: 'bangalore'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ API Response Status:', response.status);
    console.log('📊 API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log('🎉 SUCCESS: Updated endpoints are working!');
      console.log('📋 Found case:', response.data.data.title || 'Case found');
    } else if (response.status === 404) {
      console.log('⚠️ No results found - endpoints are working but no data for this advocate');
      console.log('💡 This is expected if advocate 2271 has no cases in the system');
    } else {
      console.log('❌ Error occurred:', response.data.error || 'Unknown error');
    }
    
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

testUpdatedEndpoints();














