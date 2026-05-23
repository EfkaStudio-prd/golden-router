# Golden Router v2.0 QA Test Script

$baseUrl = "http://localhost:20129"

Write-Host "=== Golden Router v2.0 QA Test ===" -ForegroundColor Green
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✓ Health check passed: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: List Combos
Write-Host "Test 2: List Combos" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/combos" -Method Get
    Write-Host "✓ List combos passed: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ List combos failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Create Combo
Write-Host "Test 3: Create Combo" -ForegroundColor Yellow
try {
    $body = @{
        name = "test-combo"
        models = @(
            @{ provider = "openai"; model = "gpt-4"; priority = 1 }
            @{ provider = "anthropic"; model = "claude-3-opus"; priority = 2 }
        )
        fallbackStrategy = "sequential"
    } | ConvertTo-Json -Depth 3
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/combos" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Create combo passed: $($response.success)" -ForegroundColor Green
    $comboId = $response.data.id
} catch {
    Write-Host "✗ Create combo failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: List Accounts
Write-Host "Test 4: List Accounts" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts" -Method Get
    Write-Host "✓ List accounts passed: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ List accounts failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Create Account
Write-Host "Test 5: Create Account" -ForegroundColor Yellow
try {
    $body = @{
        provider = "openai"
        apiKey = "sk-test-key"
        priority = 1
        maxTokens = 1000000
        resetAt = "2026-06-01T00:00:00Z"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Create account passed: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Create account failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: List Quota
Write-Host "Test 6: List Quota" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/quota" -Method Get
    Write-Host "✓ List quota passed: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ List quota failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: List Logs
Write-Host "Test 7: List Logs" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/logs" -Method Get
    Write-Host "✓ List logs passed: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ List logs failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: OAuth Status
Write-Host "Test 8: OAuth Status" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sync/status" -Method Get
    Write-Host "✓ Sync status passed: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Sync status failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 9: v1 Models
Write-Host "Test 9: v1 Models" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/v1/models" -Method Get
    Write-Host "✓ v1 models passed: $($response.object)" -ForegroundColor Green
} catch {
    Write-Host "✗ v1 models failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host '=== QA Test Complete ===' -ForegroundColor Green
