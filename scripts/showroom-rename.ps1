param(
    [string]$Dir = ".\public\showroom",
    [switch]$Apply
)

Write-Host ""
Write-Host "SEO SHOWROOM RENAME TOOL" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $Dir)) {
    Write-Host "Folder not found: $Dir" -ForegroundColor Red
    exit
}

$files = Get-ChildItem $Dir -File | Where-Object { $_.Extension -match "jpg|jpeg|png|webp" }

if ($files.Count -eq 0) {
    Write-Host "No images found." -ForegroundColor Yellow
    exit
}

$counter = 1

foreach ($file in $files) {

    # базовое имя
    $name = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)

    # удаляем всё кроме букв и цифр
    $slug = $name.ToLower()
    $slug = $slug -replace "[^a-zA-Z0-9]+", "-"
    $slug = $slug.Trim("-")

    if ([string]::IsNullOrWhiteSpace($slug)) {
        $slug = "interior"
    }

    $number = "{0:D2}" -f $counter

    $newName = "odnoetazhniki-showroom-$slug-$number$($file.Extension)"

    Write-Host "$($file.Name)  ->  $newName"

    if ($Apply) {
        Rename-Item $file.FullName $newName
    }

    $counter++
}

Write-Host ""
if ($Apply) {
    Write-Host "Renaming completed." -ForegroundColor Green
} else {
    Write-Host "Dry run mode. Add -Apply to execute." -ForegroundColor Yellow
}
