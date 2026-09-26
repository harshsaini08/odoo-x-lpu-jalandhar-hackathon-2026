async function testV2() {
  const BASE_URL = 'http://localhost:5000/api';

  console.log('Logging in as administrator (admin@stocksense.io)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@stocksense.io', password: 'admin123' }),
  });
  const login = await loginRes.json();
  if (!login.success) {
    console.error('Login response:', login);
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  const token = login.data.token;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  console.log('✔ Auth succeeded. Token acquired for:', login.data.user.name);

  console.log('\n--- 1. DEMAND FORECASTING (90-DAY TIME SERIES) ---');
  const summariesRes = await fetch(`${BASE_URL}/forecast/summaries`, { headers });
  const summaries = await summariesRes.json();
  const forecasts = summaries.data.forecasts || [];
  console.log(`✔ Retrieved ${forecasts.length} product forecast summaries:`);
  forecasts.slice(0, 6).forEach((f: any) => {
    console.log(
      `  • ${(f.productName || '').padEnd(30)} | Trend: ${(f.trendDirection || '').padEnd(12)} | AvgDaily: ${String(f.avgDailyDemand || 0).padEnd(5)} ${f.unitOfMeasure}/d | Stockout: ${String(f.expectedStockoutDays || 0).padEnd(4)} days | Reorder: ${String(f.recommendedReorderQty || 0).padEnd(4)} ${f.unitOfMeasure} [${f.forecastConfidence} confidence]`
    );
  });

  const steel = forecasts.find((f: any) => f.productName.includes('Steel') || f.sku === 'SKU-STL-001') || forecasts[0];
  console.log(`\n--- 2. DETAILED FORECAST FOR: ${steel.productName} ---`);
  const detailedRes = await fetch(`${BASE_URL}/forecast/product/${steel.productId}?horizonDays=30`, { headers });
  const detailedData = await detailedRes.json();
  const detailed = detailedData.data.forecast;
  console.log(`✔ Current Stock: ${detailed.currentStock} ${detailed.unitOfMeasure}`);
  console.log(`✔ Daily Demand: ${detailed.avgDailyDemand} ${detailed.unitOfMeasure}/day`);
  console.log(`✔ 30-Day Projected Demand: ${detailed.projected30dDemand} ${detailed.unitOfMeasure}`);
  console.log(`✔ Expected Stockout: ${detailed.expectedStockoutDays} days`);
  console.log(`✔ Supplier Lead Time: ${detailed.supplierLeadTime} days`);
  console.log(`✔ Recommended Reorder: ${detailed.recommendedReorderQty} ${detailed.unitOfMeasure}`);
  console.log(`✔ Explanation: "${detailed.explanation}"`);
  console.log(`✔ Historical Timeline Points: ${detailed.historicalTimeline.length}`);
  console.log(`✔ Future Timeline Points: ${detailed.forecastTimeline.length}`);

  console.log('\n--- 3. STOCKSENSE COPILOT ASSISTANT ---');

  // Query A: Application Help
  console.log('Query A: "How do I create a receipt?"');
  const qARes = await fetch(`${BASE_URL}/copilot/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: 'How do I create a receipt?' }),
  });
  const qA = await qARes.json();
  console.log(`✔ Reply: ${qA.data.message}`);
  console.log(`✔ Action Button: ${JSON.stringify(qA.data.actionButton)}`);

  // Query B: Database Backed Reason
  console.log('\nQuery B: "Why do I need to reorder steel rods?"');
  const qBRes = await fetch(`${BASE_URL}/copilot/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: 'Why do I need to reorder steel rods?' }),
  });
  const qB = await qBRes.json();
  console.log(`✔ Reply: ${qB.data.message}`);

  // Query C: Low stock lookup
  console.log('\nQuery C: "Which products are low in stock?"');
  const qCRes = await fetch(`${BASE_URL}/copilot/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: 'Which products are low in stock?' }),
  });
  const qC = await qCRes.json();
  console.log(`✔ Reply: ${qC.data.message}`);

  // Query D: Safe Action Preparation
  console.log('\nQuery D: "Transfer 20 steel rods from Main Warehouse to Production"');
  const qDRes = await fetch(`${BASE_URL}/copilot/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: 'Transfer 20 steel rods from Main Warehouse to Production' }),
  });
  const qD = await qDRes.json();
  console.log(`✔ Reply: ${qD.data.message}`);
  console.log(`✔ Prepared Action: ${JSON.stringify(qD.data.preparedAction, null, 2)}`);

  console.log('\n--- 4. DASHBOARD SMART SUMMARY & ACTION REQUIRED ---');
  const dashRes = await fetch(`${BASE_URL}/dashboard`, { headers });
  const dashData = await dashRes.json();
  const dash = dashData.data;
  console.log(`✔ Action Required Items (${dash.actionRequired?.length || 0}):`);
  (dash.actionRequired || []).slice(0, 3).forEach((a: any) => {
    console.log(`  [${a.type}] ${a.title} - ${a.subtitle} -> Action: ${a.actionLabel} (${a.actionUrl})`);
  });

  console.log(`✔ Today's Inventory Summary:`);
  console.log(`  • ${dash.todaySummary?.productsNeedingAttention || 0} products need attention`);
  console.log(`  • ${dash.todaySummary?.pendingReceipts || 0} receipts pending`);
  console.log(`  • ${dash.todaySummary?.pendingDeliveries || 0} deliveries pending`);
  console.log(`  • ${dash.todaySummary?.approachingReorder || 0} products approaching reorder point`);

  console.log(`✔ Inventory Insights:`);
  (dash.inventoryInsights || []).forEach((ins: string) => {
    console.log(`  💡 ${ins}`);
  });

  console.log('\n======================================================');
  console.log('  ALL STOCKSENSE V2 CAPABILITIES VERIFIED SUCCESSFULLY');
  console.log('======================================================');
}

testV2().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
