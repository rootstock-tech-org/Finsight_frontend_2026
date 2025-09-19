// Test script for external stock API integration
const { externalStockApi } = require('./src/lib/services/external-stock-api.ts');

async function testExternalAPI() {
  console.log('🧪 Testing External Stock API Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await externalStockApi.healthCheck();
    console.log('Health Status:', health);
    console.log('');

    // Test 2: Search Stocks
    console.log('2️⃣ Testing Stock Search...');
    const searchResults = await externalStockApi.searchStocks('AAPL');
    console.log('Search Results:', searchResults);
    console.log('');

    // Test 3: Get Stock Price
    console.log('3️⃣ Testing Stock Price...');
    const priceData = await externalStockApi.getStockPrice('AAPL');
    console.log('Price Data:', priceData);
    console.log('');

    // Test 4: Get Popular Stocks
    console.log('4️⃣ Testing Popular Stocks...');
    const popularStocks = await externalStockApi.getPopularStocks();
    console.log('Popular Stocks Count:', popularStocks.length);
    console.log('Sample:', popularStocks[0]);
    console.log('');

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Details:', error);
  }
}

// Run the test
testExternalAPI();

