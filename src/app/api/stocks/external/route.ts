import { NextRequest, NextResponse } from 'next/server';
import { externalStockApi } from '@/lib/services/external-stock-api';

/**
 * External Stock API Routes
 * Handles all external stock API operations
 */

// GET /api/stocks/external - Search stocks using external API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const symbol = searchParams.get('symbol');
    const action = searchParams.get('action') || 'search';

    console.log('🔍 External API request:', { query, symbol, action });

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required for search' },
            { status: 400 }
          );
        }

        const searchResults = await externalStockApi.searchStocks(query);
        return NextResponse.json({
          results: searchResults,
          query,
          total: searchResults.length
        });

      case 'price':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter is required for price lookup' },
            { status: 400 }
          );
        }

        const priceData = await externalStockApi.getStockPrice(symbol);
        return NextResponse.json({
          symbol: symbol.toUpperCase(),
          ...priceData
        });

      case 'search-and-price':
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required for search-and-price' },
            { status: 400 }
          );
        }

        const { searchResults: results, prices } = await externalStockApi.searchAndGetPrice(query);
        return NextResponse.json({
          searchResults: results,
          prices,
          query,
          total: results.length
        });

      case 'popular':
        const popularStocks = await externalStockApi.getPopularStocks();
        return NextResponse.json({
          stocks: popularStocks,
          total: popularStocks.length
        });

      case 'indices':
        const indices = await externalStockApi.getMarketIndices();
        return NextResponse.json({
          indices,
          total: indices.length
        });

      case 'health':
        const health = await externalStockApi.healthCheck();
        return NextResponse.json(health);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: search, price, search-and-price, popular, indices, health' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('External API error:', error);
    return NextResponse.json(
      { 
        error: 'External API request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/stocks/external - Batch operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, symbols, query } = body;

    console.log('🔍 External API batch request:', { action, symbols, query });

    switch (action) {
      case 'batch-prices':
        if (!symbols || !Array.isArray(symbols)) {
          return NextResponse.json(
            { error: 'Symbols array is required for batch-prices' },
            { status: 400 }
          );
        }

        const prices = await externalStockApi.getMultipleStockPrices(symbols);
        return NextResponse.json({
          prices,
          total: prices.length,
          symbols
        });

      case 'search-and-prices':
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for search-and-prices' },
            { status: 400 }
          );
        }

        const { searchResults, prices: priceResults } = await externalStockApi.searchAndGetPrice(query);
        return NextResponse.json({
          searchResults,
          prices: priceResults,
          query,
          total: searchResults.length
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: batch-prices, search-and-prices' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('External API batch error:', error);
    return NextResponse.json(
      { 
        error: 'External API batch request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

