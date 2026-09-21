[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [ValidateSet(
    'WP02_AUDIT',
    'WP02_DRY_RUN',
    'WP02_VALIDATE',
    'WP02_APPLY',
    'WP03_DRY_RUN_CREATE',
    'WP03_VALIDATE_CREATE',
    'WP03_APPLY_PAUSED',
    'WP03_READ_ENABLE',
    'WP03_VALIDATE_ENABLE',
    'WP03_ENABLE',
    'HG10_E10_READBACK',
    'HQ05_PREREQ_READ',
    'HQ07_READ',
    'HQ07_VALIDATE_CREATE',
    'HQ07_CREATE'
  )]
  [string]$Mode,

  [Parameter(Mandatory=$true)]
  [ValidatePattern('^[0-9a-fA-F]{40}$')]
  [string]$SourceRef,

  [ValidatePattern('^[0-9a-fA-F]{64}$')]
  [string]$ExpectedPlanHash,

  [ValidatePattern('^[0-9]{1,20}$')]
  [string]$LoginCustomerId,

  [string]$TargetAdGroupsJson,

  [ValidatePattern('^\d{4}-\d{2}-\d{2}$')]
  [string]$TargetDate,

  [ValidateRange(30,300)]
  [int]$EngineTimeoutSeconds = 180
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RUNNER_VERSION = 'hanyao-google-ads-host-provider-runner-v1'
$SERVICE_ACCOUNT = 'xusen-data-manager-uploader@xusen-ads-conversion.iam.gserviceaccount.com'
$ADS_SCOPE = 'https://www.googleapis.com/auth/adwords'
$REPOSITORY = 't14210184/hanyao'
$SOURCE_ARCHIVE = "https://codeload.github.com/$REPOSITORY/zip/$SourceRef"

if ([Security.Principal.WindowsIdentity]::GetCurrent().Name -ne 'NT AUTHORITY\SYSTEM') {
  throw 'HANYAO_HOST_RUNNER_REQUIRES_SYSTEM'
}

$readOnlyModes = @('WP02_AUDIT','WP02_DRY_RUN','WP02_VALIDATE','WP03_DRY_RUN_CREATE','WP03_VALIDATE_CREATE','WP03_READ_ENABLE','WP03_VALIDATE_ENABLE','HG10_E10_READBACK','HQ05_PREREQ_READ','HQ07_READ')
$applyModes = @('WP02_APPLY','WP03_APPLY_PAUSED','WP03_ENABLE','HQ07_CREATE')
if ($Mode -in $applyModes -and -not $ExpectedPlanHash) {
  throw 'HANYAO_HOST_RUNNER_EXPECTED_PLAN_HASH_REQUIRED'
}

if ($Mode -in $readOnlyModes -and $ExpectedPlanHash) {
  throw 'HANYAO_HOST_RUNNER_READ_MODE_PLAN_HASH_FORBIDDEN'
}

if ($TargetAdGroupsJson) {
  try {
    if (-not $TargetAdGroupsJson.Trim().StartsWith('[')) { throw 'invalid' }
    $targetManifest = @($TargetAdGroupsJson | ConvertFrom-Json -ErrorAction Stop)
    if ($targetManifest.Count -lt 1) { throw 'invalid' }
  } catch {
    throw 'HANYAO_HOST_RUNNER_TARGET_MANIFEST_INVALID'
  }
}

function Resolve-GcloudCommand {
  $commands = @(
    @(
      (Get-Command gcloud.cmd -ErrorAction SilentlyContinue),
      (Get-Command gcloud.exe -ErrorAction SilentlyContinue)
    ) | Where-Object { $null -ne $_ }
  )
  if ($commands.Count -gt 0) {
    return [string]$commands[0].Source
  }

  $fixed = @(
    'C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd',
    'C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
  )
  foreach ($path in $fixed) {
    if (Test-Path -LiteralPath $path) { return $path }
  }
  throw 'HANYAO_HOST_RUNNER_GCLOUD_NOT_FOUND'
}

function Get-GcloudConfigCandidates {
  $paths = New-Object System.Collections.Generic.List[string]
  if ($env:CLOUDSDK_CONFIG) { $paths.Add($env:CLOUDSDK_CONFIG) }
  $paths.Add((Join-Path $env:SystemRoot 'System32\config\systemprofile\AppData\Roaming\gcloud'))
  $paths.Add((Join-Path $env:SystemRoot 'ServiceProfiles\NetworkService\AppData\Roaming\gcloud'))

  foreach ($profile in @(Get-ChildItem -LiteralPath 'C:\Users' -Directory -ErrorAction SilentlyContinue)) {
    $paths.Add((Join-Path $profile.FullName 'AppData\Roaming\gcloud'))
  }

  return @(
    $paths |
      Select-Object -Unique |
      Where-Object { Test-Path -LiteralPath $_ -ErrorAction SilentlyContinue }
  )
}

function Get-ImpersonatedAdsToken {
  param(
    [Parameter(Mandatory=$true)][string]$Gcloud,
    [Parameter(Mandatory=$true)][string[]]$ConfigCandidates,
    [Parameter(Mandatory=$true)][string]$TempRoot
  )

  if ($ConfigCandidates.Count -eq 0) {
    throw 'HANYAO_HOST_RUNNER_GCLOUD_CONFIG_NOT_FOUND'
  }

  $originalConfig = $env:CLOUDSDK_CONFIG
  $originalDisablePrompts = $env:CLOUDSDK_CORE_DISABLE_PROMPTS
  try {
    $env:CLOUDSDK_CORE_DISABLE_PROMPTS = '1'
    for ($index = 0; $index -lt $ConfigCandidates.Count; $index += 1) {
      $env:CLOUDSDK_CONFIG = $ConfigCandidates[$index]
      $psi = New-Object Diagnostics.ProcessStartInfo
      $psi.FileName = $Gcloud
      $psi.Arguments = "auth print-access-token --impersonate-service-account=$SERVICE_ACCOUNT --scopes=$ADS_SCOPE --quiet"
      $psi.UseShellExecute = $false
      $psi.CreateNoWindow = $true
      $psi.RedirectStandardOutput = $true
      $psi.RedirectStandardError = $true

      $process = New-Object Diagnostics.Process
      $process.StartInfo = $psi
      try {
        if (-not $process.Start()) { throw 'HANYAO_HOST_RUNNER_GCLOUD_START_FAILED' }
        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        $process.WaitForExit()
        $stdout = [string]$stdoutTask.GetAwaiter().GetResult()
        $stderr = [string]$stderrTask.GetAwaiter().GetResult()
        if ($stdout.Length -gt 8192 -or $stderr.Length -gt 8192) {
          throw 'HANYAO_HOST_RUNNER_GCLOUD_OUTPUT_TOO_LARGE'
        }
        $exitCode = [int]$process.ExitCode
        $candidate = $stdout.Trim()
      } finally {
        try { $process.Dispose() } catch {}
      }

      if (
        $exitCode -eq 0 -and
        $candidate.Length -ge 80 -and
        $candidate -notmatch '\s'
      ) {
        return [ordered]@{
          token = $candidate
          config_index = $index + 1
          config_candidates = $ConfigCandidates.Count
        }
      }
    }
  } finally {
    if ($null -eq $originalConfig) {
      Remove-Item Env:CLOUDSDK_CONFIG -ErrorAction SilentlyContinue
    } else {
      $env:CLOUDSDK_CONFIG = $originalConfig
    }
    if ($null -eq $originalDisablePrompts) {
      Remove-Item Env:CLOUDSDK_CORE_DISABLE_PROMPTS -ErrorAction SilentlyContinue
    } else {
      $env:CLOUDSDK_CORE_DISABLE_PROMPTS = $originalDisablePrompts
    }
  }

  throw 'HANYAO_HOST_RUNNER_IMPERSONATION_FAILED'
}

function Resolve-NodeCommand {
  $command = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($command) { return [string]$command.Source }
  $fixed = 'C:\Program Files\nodejs\node.exe'
  if (Test-Path -LiteralPath $fixed) { return $fixed }
  throw 'HANYAO_HOST_RUNNER_NODE_NOT_FOUND'
}

function Invoke-HanyaoNodeEngine {
  param(
    [Parameter(Mandatory=$true)][string]$Node,
    [Parameter(Mandatory=$true)][string]$SourceRoot,
    [Parameter(Mandatory=$true)][string]$ScriptRelativePath,
    [string[]]$EngineArgs,
    [Parameter(Mandatory=$true)][string]$AccessToken,
    [string]$AuditOutputPath
  )

  $scriptPath = Join-Path $SourceRoot $ScriptRelativePath
  if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw 'HANYAO_HOST_RUNNER_ENGINE_SCRIPT_MISSING'
  }

  $quotedScript = '"' + $scriptPath.Replace('"','\"') + '"'
  $arguments = @('--experimental-strip-types', $quotedScript) + @($EngineArgs)
  $psi = New-Object Diagnostics.ProcessStartInfo
  $psi.FileName = $Node
  $psi.Arguments = ($arguments -join ' ')
  $psi.WorkingDirectory = $SourceRoot
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.EnvironmentVariables['GOOGLE_ADS_ACCESS_TOKEN'] = $AccessToken
  if ($LoginCustomerId) {
    $psi.EnvironmentVariables['GOOGLE_ADS_LOGIN_CUSTOMER_ID'] = $LoginCustomerId
  }

  switch ($Mode) {
    'WP02_AUDIT' {
      $psi.EnvironmentVariables['ADS_HYGIENE_LIVE_REQUIRED'] = '1'
      $psi.EnvironmentVariables['ADS_HYGIENE_OUTPUT_PATH'] = $AuditOutputPath
    }
    'WP02_APPLY' {
      $psi.EnvironmentVariables['ADS_HYGIENE_EXPECTED_PLAN_HASH'] = $ExpectedPlanHash
      $psi.EnvironmentVariables['ADS_HYGIENE_PRODUCTION_GATE'] = 'HANYAO_WP02_APPROVED_20260918'
    }
    'WP03_APPLY_PAUSED' {
      $psi.EnvironmentVariables['ADS_RSA_EXPECTED_PLAN_HASH'] = $ExpectedPlanHash
      $psi.EnvironmentVariables['ADS_RSA_PRODUCTION_GATE'] = 'HANYAO_WP03_PAUSED_CREATE_APPROVED_20260918'
    }
    'WP03_ENABLE' {
      $psi.EnvironmentVariables['ADS_RSA_EXPECTED_PLAN_HASH'] = $ExpectedPlanHash
      $psi.EnvironmentVariables['ADS_RSA_PRODUCTION_GATE'] = 'HANYAO_WP03_ENABLE_APPROVED_20260918'
    }
    'HG10_E10_READBACK' {
      if (-not $TargetDate) { throw 'HANYAO_HOST_RUNNER_TARGET_DATE_REQUIRED' }
      $psi.EnvironmentVariables['GOOGLE_ADS_REPORTING_TARGET_DATE'] = $TargetDate
    }
    'HQ07_VALIDATE_CREATE' {
      $psi.EnvironmentVariables['HQ07_PRODUCTION_GATE'] = 'HANYAO_HQ07_GOAL_MODE_20260920'
    }
    'HQ07_CREATE' {
      $psi.EnvironmentVariables['HQ07_EXPECTED_PLAN_HASH'] = $ExpectedPlanHash
      $psi.EnvironmentVariables['HQ07_PRODUCTION_GATE'] = 'HANYAO_HQ07_GOAL_MODE_20260920'
    }
  }

  if ($TargetAdGroupsJson) {
    $psi.EnvironmentVariables['ADS_RSA_TARGET_AD_GROUPS_JSON'] = $TargetAdGroupsJson
  }

  $process = New-Object Diagnostics.Process
  $process.StartInfo = $psi
  try {
    if (-not $process.Start()) { throw 'HANYAO_HOST_RUNNER_ENGINE_START_FAILED' }
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()

    if (-not $process.WaitForExit($EngineTimeoutSeconds * 1000)) {
      try {
        & (Join-Path $env:SystemRoot 'System32\taskkill.exe') /PID $process.Id /T /F *> $null
      } catch {
        try { $process.Kill() } catch {}
      }
      throw 'HANYAO_HOST_RUNNER_ENGINE_TIMEOUT'
    }

    $stdout = [string]$stdoutTask.GetAwaiter().GetResult()
    $stderr = [string]$stderrTask.GetAwaiter().GetResult()
    if ($stdout.Length -gt 65536 -or $stderr.Length -gt 65536) {
      throw 'HANYAO_HOST_RUNNER_ENGINE_OUTPUT_TOO_LARGE'
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

$runId = [Guid]::NewGuid().ToString('N')
$tempRoot = Join-Path $env:TEMP ("hanyao-google-ads-$runId")
$zipPath = Join-Path $tempRoot 'source.zip'
$extractRoot = Join-Path $tempRoot 'source'
$evidenceRoot = Join-Path $env:ProgramData 'HANYAO\GoogleAds\evidence'
$accessToken = $null

try {
  New-Item -ItemType Directory -Path $tempRoot,$extractRoot,$evidenceRoot -Force | Out-Null

  $gcloud = Resolve-GcloudCommand
  $configs = @(Get-GcloudConfigCandidates)
  $tokenResult = Get-ImpersonatedAdsToken -Gcloud $gcloud -ConfigCandidates $configs -TempRoot $tempRoot
  $accessToken = [string]$tokenResult.token

  Invoke-WebRequest -UseBasicParsing -Uri $SOURCE_ARCHIVE -OutFile $zipPath
  if ((Get-Item -LiteralPath $zipPath).Length -lt 1024) {
    throw 'HANYAO_HOST_RUNNER_SOURCE_ARCHIVE_INVALID'
  }
  Expand-Archive -LiteralPath $zipPath -DestinationPath $extractRoot -Force
  $roots = @(Get-ChildItem -LiteralPath $extractRoot -Directory)
  if ($roots.Count -ne 1) { throw 'HANYAO_HOST_RUNNER_SOURCE_ROOT_INVALID' }
  $sourceRoot = $roots[0].FullName

  $node = Resolve-NodeCommand
  $auditEvidencePath = $null
  $script = $null
  $engineArgs = @()

  switch ($Mode) {
    'WP02_AUDIT' {
      $script = 'scripts\ads-search-hygiene-audit.ts'
      $auditEvidencePath = Join-Path $evidenceRoot ("wp02-audit-$($SourceRef.Substring(0,12))-$([DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')).json")
    }
    'WP02_DRY_RUN' {
      $script = 'scripts\ads-search-hygiene-mutate.ts'
    }
    'WP02_VALIDATE' {
      $script = 'scripts\ads-search-hygiene-mutate.ts'
      $engineArgs = @('--validate')
    }
    'WP02_APPLY' {
      $script = 'scripts\ads-search-hygiene-mutate.ts'
      $engineArgs = @('--apply')
    }
    'WP03_DRY_RUN_CREATE' {
      $script = 'scripts\ads-rsa-provider.ts'
    }
    'WP03_VALIDATE_CREATE' {
      $script = 'scripts\ads-rsa-provider.ts'
      $engineArgs = @('--validate-create')
    }
    'WP03_APPLY_PAUSED' {
      $script = 'scripts\ads-rsa-provider.ts'
      $engineArgs = @('--apply-paused')
    }
    'WP03_READ_ENABLE' {
      $script = 'scripts\ads-rsa-provider.ts'
      $engineArgs = @('--read-enable')
    }
    'WP03_VALIDATE_ENABLE' {
      $script = 'scripts\ads-rsa-provider.ts'
      $engineArgs = @('--validate-enable')
    }
    'WP03_ENABLE' {
      $script = 'scripts\ads-rsa-provider.ts'
      $engineArgs = @('--enable')
    }
    'HG10_E10_READBACK' {
      $script = 'scripts\line4d-google-ads-reporting-monitor.ts'
    }
    'HQ05_PREREQ_READ' {
      $script = 'scripts\ads-enhanced-conversion-prereq.ts'
    }
    'HQ07_READ' {
      $script = 'scripts\ads-qualified-lead-action.ts'
    }
    'HQ07_VALIDATE_CREATE' {
      $script = 'scripts\ads-qualified-lead-action.ts'
      $engineArgs = @('--validate-create')
    }
    'HQ07_CREATE' {
      $script = 'scripts\ads-qualified-lead-action.ts'
      $engineArgs = @('--apply')
    }
  }

  $engine = Invoke-HanyaoNodeEngine -Node $node -SourceRoot $sourceRoot -ScriptRelativePath $script -EngineArgs $engineArgs -AccessToken $accessToken -AuditOutputPath $auditEvidencePath

  $summary = [ordered]@{
    schema = 'hanyao.google-ads.host-runner.result.v1'
    runner_version = $RUNNER_VERSION
    result = if ($engine.exit_code -eq 0) { 'ENGINE_COMPLETED' } else { 'ENGINE_FAILED' }
    mode = $Mode
    source_ref = $SourceRef.ToLowerInvariant()
    run_as = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    service_account = $SERVICE_ACCOUNT
    oauth_scope = $ADS_SCOPE
    gcloud_config_candidates = [int]$tokenResult.config_candidates
    selected_config_index = [int]$tokenResult.config_index
    access_token_printed = $false
    access_token_persisted = $false
    engine_exit_code = [int]$engine.exit_code
    engine_stdout = [string]$engine.stdout
    engine_stderr = [string]$engine.stderr
    audit_evidence_path = $auditEvidencePath
    recorded_at_utc = [DateTime]::UtcNow.ToString('o')
  }
  $summary | ConvertTo-Json -Depth 8 -Compress

  if ($engine.exit_code -ne 0) { exit $engine.exit_code }
} finally {
  $accessToken = $null
  Remove-Variable accessToken -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
