[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [ValidatePattern('^[0-9a-fA-F]{40}$')]
  [string]$SourceRef,

  [Parameter(Mandatory=$true)]
  [ValidatePattern('^\d{4}-\d{2}-\d{2}$')]
  [string]$TargetDate,

  [ValidatePattern('^[0-9a-fA-F]{32}$')]
  [string]$CloudflareAccountId,

  [ValidateRange(30,300)]
  [int]$EngineTimeoutSeconds = 180
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RUNNER_VERSION = 'hanyao-hg10-system-readback-runner-v1'
$REPOSITORY = 't14210184/hanyao'
$SOURCE_ARCHIVE = "https://codeload.github.com/$REPOSITORY/zip/$SourceRef"
$PRODUCTION_D1_ID = '52453bad-90a3-4495-911b-c3d5b6cefb1f'

if ([Security.Principal.WindowsIdentity]::GetCurrent().Name -ne 'NT AUTHORITY\SYSTEM') {
  throw 'HG10_SYSTEM_READBACK_REQUIRES_SYSTEM'
}

function Invoke-CapturedProcess {
  param(
    [Parameter(Mandatory=$true)][string]$FileName,
    [Parameter(Mandatory=$true)][string]$Arguments,
    [Parameter(Mandatory=$true)][string]$WorkingDirectory,
    [hashtable]$EnvironmentOverrides = @{},
    [ValidateRange(10,300)][int]$TimeoutSeconds = 120
  )

  $psi = New-Object Diagnostics.ProcessStartInfo
  $psi.FileName = $FileName
  $psi.Arguments = $Arguments
  $psi.WorkingDirectory = $WorkingDirectory
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  foreach ($key in $EnvironmentOverrides.Keys) {
    $psi.EnvironmentVariables[$key] = [string]$EnvironmentOverrides[$key]
  }

  $process = New-Object Diagnostics.Process
  $process.StartInfo = $psi
  try {
    if (-not $process.Start()) { throw 'HG10_CHILD_START_FAILED' }
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
      try {
        & (Join-Path $env:SystemRoot 'System32\taskkill.exe') /PID $process.Id /T /F *> $null
      } catch {
        try { $process.Kill() } catch {}
      }
      throw 'HG10_CHILD_TIMEOUT'
    }
    $stdout = [string]$stdoutTask.GetAwaiter().GetResult()
    $stderr = [string]$stderrTask.GetAwaiter().GetResult()
    if ($stdout.Length -gt 131072 -or $stderr.Length -gt 65536) {
      throw 'HG10_CHILD_OUTPUT_TOO_LARGE'
    }
    return [ordered]@{
      exit_code = [int]$process.ExitCode
      stdout = $stdout.Trim()
      stderr = $stderr.Trim()
    }
  } finally {
    try { $process.Dispose() } catch {}
  }
}

function Resolve-NodeCommand {
  $command = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($command) { return [string]$command.Source }
  $fixed = 'C:\Program Files\nodejs\node.exe'
  if (Test-Path -LiteralPath $fixed) { return $fixed }
  throw 'HG10_NODE_NOT_FOUND'
}

function Resolve-PowerShellCommand {
  $fixed = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
  if (Test-Path -LiteralPath $fixed) { return $fixed }
  throw 'HG10_POWERSHELL_NOT_FOUND'
}

function Resolve-NpxCommand {
  $command = Get-Command npx.cmd -ErrorAction SilentlyContinue
  if ($command) { return [string]$command.Source }
  $fixed = 'C:\Program Files\nodejs\npx.cmd'
  if (Test-Path -LiteralPath $fixed) { return $fixed }
  throw 'HG10_NPX_NOT_FOUND'
}

function Get-WranglerToolRoots {
  $roots = New-Object System.Collections.Generic.List[string]
  foreach ($profile in @(Get-ChildItem -LiteralPath 'C:\Users' -Directory -ErrorAction SilentlyContinue)) {
    $candidate = Join-Path $profile.FullName 'hanyao-wrangler-tool'
    if (Test-Path -LiteralPath (Join-Path $candidate 'package.json')) {
      $roots.Add($candidate)
    }
  }
  return @($roots | Select-Object -Unique)
}

function Get-WranglerConfigHomes {
  $homes = New-Object System.Collections.Generic.List[string]
  foreach ($profile in @(Get-ChildItem -LiteralPath 'C:\Users' -Directory -ErrorAction SilentlyContinue)) {
    $candidate = Join-Path $profile.FullName 'AppData\Roaming\xdg.config'
    $encrypted = Join-Path $candidate '.wrangler\config\default.enc'
    if (Test-Path -LiteralPath $encrypted) {
      $homes.Add($candidate)
    }
  }
  return @($homes | Select-Object -Unique)
}

function Resolve-CloudflareAuth {
  param(
    [Parameter(Mandatory=$true)][string]$Npx,
    [Parameter(Mandatory=$true)][string[]]$ToolRoots,
    [Parameter(Mandatory=$true)][string[]]$ConfigHomes
  )

  if ($ToolRoots.Count -eq 0 -or $ConfigHomes.Count -eq 0) {
    throw 'HG10_WRANGLER_AUTH_SURFACE_NOT_FOUND'
  }

  for ($rootIndex = 0; $rootIndex -lt $ToolRoots.Count; $rootIndex += 1) {
    for ($configIndex = 0; $configIndex -lt $ConfigHomes.Count; $configIndex += 1) {
      $envMap = @{ XDG_CONFIG_HOME = $ConfigHomes[$configIndex] }
      $tokenResult = Invoke-CapturedProcess -FileName $Npx -Arguments 'wrangler auth token --json' -WorkingDirectory $ToolRoots[$rootIndex] -EnvironmentOverrides $envMap -TimeoutSeconds 60
      if ($tokenResult.exit_code -ne 0 -or -not $tokenResult.stdout) { continue }

      try {
        $tokenPayload = $tokenResult.stdout | ConvertFrom-Json
      } catch {
        continue
      }
      $token = [string]$tokenPayload.token
      if ([string]::IsNullOrWhiteSpace($token) -or $token.Length -lt 20 -or $token -match '\s') {
        continue
      }

      $whoamiResult = Invoke-CapturedProcess -FileName $Npx -Arguments 'wrangler whoami --json' -WorkingDirectory $ToolRoots[$rootIndex] -EnvironmentOverrides $envMap -TimeoutSeconds 60
      if ($whoamiResult.exit_code -ne 0 -or -not $whoamiResult.stdout) {
        $token = $null
        continue
      }

      try {
        $whoami = $whoamiResult.stdout | ConvertFrom-Json
      } catch {
        $token = $null
        continue
      }
      $accounts = @($whoami.accounts)
      if ($CloudflareAccountId) {
        $account = @($accounts | Where-Object { $_.id -eq $CloudflareAccountId })
        if ($account.Count -ne 1) {
          $token = $null
          continue
        }
        $accountId = $CloudflareAccountId
      } else {
        if ($accounts.Count -ne 1) {
          $token = $null
          throw 'HG10_CLOUDFLARE_ACCOUNT_AMBIGUOUS'
        }
        $accountId = [string]$accounts[0].id
      }
      if ($accountId -notmatch '^[0-9a-fA-F]{32}$') {
        $token = $null
        continue
      }

      return [ordered]@{
        token = $token
        account_id = $accountId
        tool_root = $ToolRoots[$rootIndex]
        tool_root_index = $rootIndex + 1
        tool_root_candidates = $ToolRoots.Count
        config_home = $ConfigHomes[$configIndex]
        config_index = $configIndex + 1
        config_candidates = $ConfigHomes.Count
      }
    }
  }

  throw 'HG10_WRANGLER_AUTH_UNAVAILABLE'
}

$runId = [Guid]::NewGuid().ToString('N')
$tempRoot = Join-Path $env:TEMP ("hanyao-hg10-system-$runId")
$zipPath = Join-Path $tempRoot 'source.zip'
$extractRoot = Join-Path $tempRoot 'source'
$d1EvidencePath = Join-Path $tempRoot 'd1.json'
$adsEvidencePath = Join-Path $tempRoot 'ads.json'
$cloudflareToken = $null

try {
  New-Item -ItemType Directory -Path $tempRoot,$extractRoot -Force | Out-Null

  Invoke-WebRequest -UseBasicParsing -Uri $SOURCE_ARCHIVE -OutFile $zipPath
  if ((Get-Item -LiteralPath $zipPath).Length -lt 1024) {
    throw 'HG10_SOURCE_ARCHIVE_INVALID'
  }
  Expand-Archive -LiteralPath $zipPath -DestinationPath $extractRoot -Force
  $sourceRoots = @(Get-ChildItem -LiteralPath $extractRoot -Directory)
  if ($sourceRoots.Count -ne 1) { throw 'HG10_SOURCE_ROOT_INVALID' }
  $sourceRoot = $sourceRoots[0].FullName

  $node = Resolve-NodeCommand
  $npx = Resolve-NpxCommand
  $powershell = Resolve-PowerShellCommand
  $wranglerRoots = @(Get-WranglerToolRoots)
  $wranglerConfigs = @(Get-WranglerConfigHomes)
  $cloudflare = Resolve-CloudflareAuth -Npx $npx -ToolRoots $wranglerRoots -ConfigHomes $wranglerConfigs
  $cloudflareToken = [string]$cloudflare.token

  $d1Script = Join-Path $sourceRoot 'scripts\hg10-e17-d1-readback.mjs'
  if (-not (Test-Path -LiteralPath $d1Script)) { throw 'HG10_D1_SCRIPT_MISSING' }
  $d1Env = @{
    CLOUDFLARE_API_TOKEN = $cloudflareToken
    CLOUDFLARE_ACCOUNT_ID = [string]$cloudflare.account_id
    HG10_PRODUCTION_D1_ID = $PRODUCTION_D1_ID
  }
  $d1 = Invoke-CapturedProcess -FileName $node -Arguments ('"' + $d1Script + '" --date ' + $TargetDate) -WorkingDirectory $sourceRoot -EnvironmentOverrides $d1Env -TimeoutSeconds $EngineTimeoutSeconds
  if ($d1.exit_code -ne 0 -or -not $d1.stdout) {
    throw 'HG10_D1_READBACK_FAILED'
  }
  try {
    $d1Json = $d1.stdout | ConvertFrom-Json
  } catch {
    throw 'HG10_D1_READBACK_MALFORMED'
  }
  if ($d1Json.result -ne 'D1_READBACK_PASS' -or $d1Json.readOnlyGuard -ne $true) {
    throw 'HG10_D1_READBACK_NOT_SAFE'
  }
  [IO.File]::WriteAllText($d1EvidencePath, ($d1Json | ConvertTo-Json -Depth 12 -Compress), (New-Object Text.UTF8Encoding($false)))

  $adsRunner = Join-Path $sourceRoot 'scripts\google-ads-provider-host-runner.ps1'
  if (-not (Test-Path -LiteralPath $adsRunner)) { throw 'HG10_ADS_RUNNER_MISSING' }
  $adsArgs = '-NoProfile -ExecutionPolicy Bypass -File "' + $adsRunner + '" -Mode HG10_E10_READBACK -SourceRef ' + $SourceRef + ' -TargetDate ' + $TargetDate + ' -EngineTimeoutSeconds ' + $EngineTimeoutSeconds
  $ads = Invoke-CapturedProcess -FileName $powershell -Arguments $adsArgs -WorkingDirectory $sourceRoot -TimeoutSeconds ($EngineTimeoutSeconds + 30)
  if ($ads.exit_code -ne 0 -or -not $ads.stdout) {
    throw 'HG10_ADS_READBACK_FAILED'
  }
  try {
    $adsRunnerJson = $ads.stdout | ConvertFrom-Json
  } catch {
    throw 'HG10_ADS_RUNNER_OUTPUT_MALFORMED'
  }
  if ($adsRunnerJson.result -ne 'ENGINE_COMPLETED' -or [int]$adsRunnerJson.engine_exit_code -ne 0) {
    throw 'HG10_ADS_ENGINE_NOT_COMPLETED'
  }
  try {
    $adsJson = [string]$adsRunnerJson.engine_stdout | ConvertFrom-Json
  } catch {
    throw 'HG10_ADS_EVIDENCE_MALFORMED'
  }
  [IO.File]::WriteAllText($adsEvidencePath, ($adsJson | ConvertTo-Json -Depth 12 -Compress), (New-Object Text.UTF8Encoding($false)))

  $inspector = Join-Path $sourceRoot 'scripts\hg10-e17-inspector.mjs'
  if (-not (Test-Path -LiteralPath $inspector)) { throw 'HG10_INSPECTOR_MISSING' }
  $inspectArgs = '"' + $inspector + '" --d1-json "' + $d1EvidencePath + '" --ads-json "' + $adsEvidencePath + '"'
  $inspect = Invoke-CapturedProcess -FileName $node -Arguments $inspectArgs -WorkingDirectory $sourceRoot -TimeoutSeconds 60
  if ($inspect.exit_code -ne 0 -or -not $inspect.stdout) {
    throw 'HG10_INSPECTOR_FAILED'
  }
  try {
    $verdict = $inspect.stdout | ConvertFrom-Json
  } catch {
    throw 'HG10_INSPECTOR_OUTPUT_MALFORMED'
  }

  [ordered]@{
    schema = 'hanyao.hg10-system-readback.result.v1'
    runner_version = $RUNNER_VERSION
    result = 'HG10_SYSTEM_READBACK_COMPLETE'
    source_ref = $SourceRef.ToLowerInvariant()
    target_date = $TargetDate
    run_as = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    cloudflare_account_id = [string]$cloudflare.account_id
    production_d1_id = $PRODUCTION_D1_ID
    wrangler_config_candidates = [int]$cloudflare.config_candidates
    selected_wrangler_config_index = [int]$cloudflare.config_index
    cloudflare_token_printed = $false
    cloudflare_token_persisted = $false
    d1_read_only_guard = [bool]$d1Json.readOnlyGuard
    d1_rows_read = [int64]$d1Json.rowsRead
    line_matched_ads_count = [int]$d1Json.lineMatchedAdsCount
    business_conversion_count = [int]$d1Json.businessConversionCount
    eligible_business_count = [int]$d1Json.eligibleBusinessCount
    outbox_count = [int]$d1Json.outboxCount
    provider_attempt_count = [int]$d1Json.providerAttemptCount
    request_id_count = [int]$d1Json.requestIdCount
    diagnostic_success_count = [int]$d1Json.diagnosticSuccessCount
    diagnostic_failed_count = [int]$d1Json.diagnosticFailedCount
    reconciliation_count = [int]$d1Json.reconciliationCount
    google_ads_auth_source = [string]$adsJson.authSource
    google_ads_all_conversions = [double]$adsJson.allConversions
    google_ads_last_conversion_date = [string]$adsJson.lastConversionDate
    google_ads_date_row_returned = [bool]$adsJson.targetDateEvidence.rowReturned
    google_ads_date_conversions = [double]$adsJson.targetDateEvidence.allConversionsByConversionDate
    closure_state = [string]$verdict.state
    recorded_at_utc = [DateTime]::UtcNow.ToString('o')
  } | ConvertTo-Json -Depth 8 -Compress
} finally {
  $cloudflareToken = $null
  Remove-Variable cloudflareToken -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
