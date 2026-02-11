param(
  [string]$Root = ".\public\showroom",
  [switch]$Apply
)

$categories = @(
  "exterior","interior","kitchen","bathroom","bedroom","engineering","plan","landscape","misc"
)

function EnsureDir($p) { if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null } }

if (!(Test-Path $Root)) { Write-Host "Not found: $Root" -ForegroundColor Red; exit 1 }

foreach ($c in $categories) { EnsureDir (Join-Path $Root $c) }

Write-Host ""
Write-Host "SHOWROOM FINALIZE (SEO rename + numbering per category)" -ForegroundColor Cyan
Write-Host "Root: $Root"
Write-Host ("Mode: " + ($(if($Apply){"APPLY"}else{"DRY-RUN"}))) -ForegroundColor Yellow
Write-Host ""

foreach ($c in $categories) {
  $dir = Join-Path $Root $c
  if (!(Test-Path $dir)) { continue }

  $files = Get-ChildItem -Path $dir -File | Where-Object { $_.Extension -match "\.(jpg|jpeg|png|webp)$" } | Sort-Object Name
  if ($files.Count -eq 0) { continue }

  $i = 1
  foreach ($f in $files) {
    $ext = $f.Extension.ToLower()

    $nn = "{0:D2}" -f $i
    $base = "odnoetazhniki-showroom-$c-$nn"
    $newName = "$base$ext"

    # collision protection
    $candidate = $newName
    $k = 2
    while (Test-Path (Join-Path $dir $candidate)) {
      $candidate = "$base-$k$ext"
      $k++
    }
    $newName = $candidate

    if ($f.Name -ne $newName) {
      Write-Host "$c : $($f.Name) -> $newName"
      if ($Apply) {
        Rename-Item -Path $f.FullName -NewName $newName
      }
    }

    $i++
  }
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
