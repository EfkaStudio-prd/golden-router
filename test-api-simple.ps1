# Golden Router v2.0 QA Test Script

$baseUrl = "http://localhost:20129"

Write-Host "=== Golden Router v2.0 QA Test ===" -ForegroundColor Green
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "[PASS] Health check: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Health check: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: List Combos
Write-Host "Test 2: List Combos" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/combos" -Method Get
    Write-Host "[PASS] List combos: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] List combos: $_" -ForegroundColor Red
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
    Write-Host "[PASS] Create combo: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Create combo: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: List Accounts
Write-Host "Test 4: List Accounts" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/accounts" -Method Get
    Write-Host "[PASS] List accounts: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] List accounts: $_" -ForegroundColor Red
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
    Write-Host "[PASS] Create account: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Create account: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: List Quota
Write-Host "Test 6: List Quota" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/quota" -Method Get
    Write-Host "[PASS] List quota: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] List quota: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: List Logs
Write-Host "Test 7: List Logs" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/logs" -Method Get
    Write-Host "[PASS] List logs: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] List logs: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: Sync Status
Write-Host "Test 8: Sync Status" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sync/status" -Method Get
    Write-Host "[PASS] Sync status: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Sync status: $_" -ForegroundColor Red
}
Write-Host ""

# Test 9: v1 Models
Write-Host "Test 9: v1 Models" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/v1/models" -Method Get
    Write-Host "[PASS] v1 models: $($response.object)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] v1 models: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== QA Test Complete ===" -ForegroundColor Green
