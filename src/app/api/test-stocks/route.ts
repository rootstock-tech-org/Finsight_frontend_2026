import { NextRequest, NextResponse } from 'next/server';
import { indianStocksService } from '@/lib/services/indian-stocks-service';
import { runPodApiService } from '@/lib/services/runpod-api-service';

export async function GET() {
  try {
    console.log('Testing stock data integration...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    };

    // Test 1: Get popular stocks
    try {
      console.log('Test 1: Fetching popular stocks...');
      const popularStocks = await indianStocksService.getPopularStocks();
      results.tests.push({
        name: 'Popular Stocks',
        success: true,
        count: popularStocks.length,
        sample: popularStocks.slice(0, 3).map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.last_price,
          change: stock.change_percent
        }))
      });
    } catch (error) {
      results.tests.push({
        name: 'Popular Stocks',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Test RunPod API health
    try {
      console.log('Test 2: Testing RunPod API health...');
      const healthCheck = await runPodApiService.healthCheck();
      results.tests.push({
        name: 'RunPod API Health',
        success: healthCheck,
        message: healthCheck ? 'API is healthy' : 'API is not responding'
      });
    } catch (error) {
      results.tests.push({
        name: 'RunPod API Health',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Search stocks
    try {
      console.log('Test 3: Searching stocks...');
      const searchResults = await indianStocksService.searchStocks('RELIANCE');
      results.tests.push({
        name: 'Stock Search',
        success: true,
        count: searchResults.length,
        sample: searchResults.slice(0, 3).map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.last_price,
          change: stock.change_percent
        }))
      });
    } catch (error) {
      results.tests.push({
        name: 'Stock Search',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Get specific stock price
    try {
      console.log('Test 4: Getting specific stock price...');
      const priceData = await indianStocksService.getStockPrice('RELIANCE');
      results.tests.push({
        name: 'Stock Price',
        success: true,
        data: priceData
      });
    } catch (error) {
      results.tests.push({
        name: 'Stock Price',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const successCount = results.tests.filter(test => test.success).length;
    const totalTests = results.tests.length;

    return NextResponse.json({
      message: `Stock data integration test completed: ${successCount}/${totalTests} tests passed`,
      success: successCount === totalTests,
      results
    });

  } catch (error) {
    console.error('Stock test error:', error);
    return NextResponse.json(
      { 
        error: 'Stock test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

