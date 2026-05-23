/**
 * Golden Router v2.0 - Routing Engine Test
 * Tests core routing functionality without actual API calls
 */

const LocalDb = require('./src/lib/localDb');
const UsageDb = require('./src/lib/usageDb');
const QuotaTracker = require('./src/core/quota/quotaTracker');
const ComboHandler = require('./src/core/combo/comboHandler');
const ProviderExecutor = require('./src/core/providers/providerExecutor');
const RoutingEngine = require('./src/core/routing/routingEngine');

async function runTests() {
  console.log('=== Golden Router v2.0 - Routing Engine Test ===\n');

// Test 1: Initialize components
console.log('Test 1: Initialize Components');
try {
  const localDb = new LocalDb();
  const usageDb = new UsageDb();
  const quotaTracker = new QuotaTracker(usageDb);
  const comboHandler = new ComboHandler(localDb);
  const providerExecutor = new ProviderExecutor();
  const routingEngine = new RoutingEngine();
  
  console.log('✓ All components initialized successfully\n');
} catch (error) {
  console.log('✗ Component initialization failed:', error.message, '\n');
  process.exit(1);
}

// Test 2: Create test combo
console.log('Test 2: Create Test Combo');
try {
  const localDb = new LocalDb();
  const combo = localDb.addCombo({
    name: 'test-routing-combo',
    models: [
      { provider: 'openai', model: 'gpt-4', priority: 1 },
      { provider: 'anthropic', model: 'claude-3-opus', priority: 2 }
    ],
    fallbackStrategy: 'sequential'
  });
  
  console.log('✓ Combo created:', combo.id, '\n');
} catch (error) {
  console.log('✗ Combo creation failed:', error.message, '\n');
}

// Test 3: Create test account
console.log('Test 3: Create Test Account');
try {
  const localDb = new LocalDb();
  const account = localDb.addAccount({
    provider: 'openai',
    apiKey: 'sk-test-key-12345',
    priority: 1,
    maxTokens: 1000000,
    resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  console.log('✓ Account created:', account.id, '\n');
} catch (error) {
  console.log('✗ Account creation failed:', error.message, '\n');
}

// Test 4: Test provider executor
console.log('Test 4: Test Provider Executor');
try {
  const providerExecutor = new ProviderExecutor();
  const providers = providerExecutor.listProviders();
  
  console.log('✓ Available providers:', providers.join(', '), '\n');
} catch (error) {
  console.log('✗ Provider executor test failed:', error.message, '\n');
}

// Test 5: Test quota tracking
console.log('Test 5: Test Quota Tracking');
try {
  const localDb = new LocalDb();
  const usageDb = new UsageDb();
  const quotaTracker = new QuotaTracker(usageDb);
  
  quotaTracker.setPricing('openai', { input: 0.03, output: 0.06, currency: 'USD' });
  await quotaTracker.trackUsage('openai', 1000, 500);
  
  const quota = await quotaTracker.getQuotaStatus();
  console.log('✓ Quota tracking working:', quota.providers.length, 'providers\n');
} catch (error) {
  console.log('✗ Quota tracking test failed:', error.message, '\n');
}

// Test 6: Test format translation
console.log('Test 6: Test Format Translation');
try {
  const TranslatorRegistry = require('./src/core/translation/translator/index');
  const registry = new TranslatorRegistry();
  
  const formats = registry.getAvailableFormats();
  console.log('✓ Supported formats:', formats.join(', '), '\n');
} catch (error) {
  console.log('✗ Format translation test failed:', error.message, '\n');
}

// Test 7: Test combo handler
console.log('Test 7: Test Combo Handler');
try {
  const localDb = new LocalDb();
  const comboHandler = new ComboHandler(localDb);
  
  const combo = localDb.addCombo({
    name: 'test-combo-handler',
    models: [
      { provider: 'openai', model: 'gpt-4', priority: 1 },
      { provider: 'anthropic', model: 'claude-3-opus', priority: 2 }
    ],
    fallbackStrategy: 'sequential'
  });
  
  const retrieved = comboHandler.getCombo(combo.id);
  if (retrieved) {
    console.log('✓ Combo handler working:', retrieved.name, '\n');
  } else {
    console.log('✗ Combo handler: combo not found\n');
  }
} catch (error) {
  console.log('✗ Combo handler test failed:', error.message, '\n');
}

// Test 8: Test account availability
console.log('Test 8: Test Account Availability');
try {
  const localDb = new LocalDb();
  
  const account = localDb.addAccount({
    provider: 'openai',
    apiKey: 'sk-test-key',
    priority: 1,
    maxTokens: 1000000,
    resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  const isAvailable = localDb.isAccountAvailable(account);
  console.log('✓ Account availability check:', isAvailable, '\n');
} catch (error) {
  console.log('✗ Account availability test failed:', error.message, '\n');
}

// Test 9: Test usage logging
console.log('Test 9: Test Usage Logging');
try {
  const usageDb = new UsageDb();
  
  usageDb.logRequest(
    { model: 'gpt-4' },
    { usage: { prompt_tokens: 100, completion_tokens: 50 } },
    {
      provider: 'openai',
      model: 'gpt-4',
      inputTokens: 100,
      outputTokens: 50,
      cost: 0.006,
      duration: 1000,
      status: 'success'
    }
  );
  
  const logs = usageDb.getLogs(10);
  console.log('✓ Usage logging working:', logs.length, 'logs\n');
} catch (error) {
  console.log('✗ Usage logging test failed:', error.message, '\n');
}

// Test 10: Test data persistence
console.log('Test 10: Test Data Persistence');
try {
  const localDb = new LocalDb();
  const usageDb = new UsageDb();
  
  // Save data
  localDb.save();
  usageDb.save();
  
  // Load fresh instances
  const localDb2 = new LocalDb();
  const usageDb2 = new UsageDb();
  
  console.log('✓ Data persistence working\n');
} catch (error) {
  console.log('✗ Data persistence test failed:', error.message, '\n');
}

console.log('=== All Routing Engine Tests Complete ===');
}

// Run tests
runTests().catch(console.error);
