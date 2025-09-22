import { NextRequest, NextResponse } from 'next/server';
import { runPodApiService } from '@/lib/services/runpod-api-service';

export async function GET() {
  try {
    console.log('Testing RunPod API integration...');
    
    const results: { timestamp: string; tests: Array<Record<string, unknown>> } = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Health check
    try {
      console.log('Test 1: Health check...');
      const healthCheck = await runPodApiService.healthCheck();
      results.tests.push({
        name: 'Health Check',
        success: healthCheck.status === 'healthy',
        message: healthCheck.message
      });
    } catch (error) {
      results.tests.push({
        name: 'Health Check',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Get popular stocks
    try {
      console.log('Test 2: Fetching popular stocks...');
      const stocks = await runPodApiService.getPopularStocks();
      results.tests.push({
        name: 'Popular Stocks',
        success: true,
        count: stocks.length,
        sample: stocks.slice(0, 3).map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.last_price,
          change: stock.change_percent,
          type: stock.type
        }))
      });
    } catch (error) {
      results.tests.push({
        name: 'Popular Stocks',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Test multiple stock prices
    try {
      console.log('Test 3: Testing multiple stock prices...');
      const stockPrices = await runPodApiService.getMultiplePrices(['RELIANCE', 'TCS', 'HDFCBANK']);
      results.tests.push({
        name: 'Multiple Stock Prices',
        success: true,
        count: stockPrices.length,
        sample: stockPrices.slice(0, 3).map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.last_price,
          change: stock.change_percent,
          type: stock.type
        }))
      });
    } catch (error) {
      results.tests.push({
        name: 'Multiple Stock Prices',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Search functionality
    try {
      console.log('Test 4: Testing search functionality...');
      const searchResults = await runPodApiService.searchAndGetPrices('RELIANCE');
      results.tests.push({
        name: 'Search Functionality',
        success: true,
        count: searchResults.length,
        sample: searchResults.slice(0, 3).map(item => ({
          symbol: item.symbol,
          name: item.name,
          price: item.last_price,
          change: item.change_percent,
          type: item.type
        }))
      });
    } catch (error) {
      results.tests.push({
        name: 'Search Functionality',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Get specific stock price
    try {
      console.log('Test 5: Getting specific stock price...');
      const stockPrice = await runPodApiService.getPrice('RELIANCE');
      results.tests.push({
        name: 'Specific Stock Price',
        success: stockPrice !== null,
        data: stockPrice ? {
          symbol: stockPrice.symbol,
          name: stockPrice.name,
          price: stockPrice.last_price,
          change: stockPrice.change_percent,
          volume: stockPrice.volume,
          type: stockPrice.type
        } : null
      });
    } catch (error) {
      results.tests.push({
        name: 'Specific Stock Price',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const successCount = results.tests.filter(test => test.success).length;
    const totalTests = results.tests.length;

    return NextResponse.json({
      message: `RunPod API integration test completed: ${successCount}/${totalTests} tests passed`,
      success: successCount === totalTests,
      results
    });

  } catch (error) {
    console.error('RunPod API test error:', error);
    return NextResponse.json(
      { 
        error: 'RunPod API test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

