<#
.SYNOPSIS
  AutoGitPush – init/commit/pull‑rebase/push na GitHub z dowolnego folderu.
.DESCRIPTION
  - Pracuje na folderze wskazanym przez parametr –Path (domyślnie bieżący katalog).
  - Automatycznie tworzy repo na GitHub (publiczne lub prywatne) przy użyciu `gh cli`.
  - Robi commit ze znacznikiem czasu, pull‑rebase, push.
.PARAMETER Path
  Ścieżka do folderu projektu (domyślnie bieżący katalog).
.PARAMETER Branch
  Nazwa gałęzi (domyślnie main).
.PARAMETER Private
  Jeśli ustawione, tworzy nowe repo jako prywatne.
#>

param(
    [string]$Path = ".",
    [string]$Branch = "main",
    [switch]$Private
)

# 1. Sprawdź, czy folder istnieje
if (-not (Test-Path $Path -PathType Container)) {
    Write-Error "Folder '$Path' nie istnieje."
    exit 1
}

# 2. Przejdź do niego
Push-Location $Path

# 3. Wymagania wstępne
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git nie znaleziony. Zainstaluj: https://git-scm.com/downloads"
    Pop-Location; exit 1
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) nie znaleziony. Zainstaluj: https://cli.github.com/"
    Pop-Location; exit 1
}

# 4. Nazwa repo – nazwa folderu
$projName = Split-Path -Leaf (Resolve-Path .)

# 5. Init repo, jeśli nie ma
if (-not (Test-Path ".git")) {
    git init
    git branch -M $Branch
    Write-Host "Zainicjalizowano repo i ustawiono gałąź '$Branch'."
}

# 6. Remote origin
try { $existing = git remote get-url origin 2>$null } catch { $existing = $null }
if (-not $existing) {
    $mode = $Private.IsPresent ? "--private" : "--public"
    Write-Host "Tworzę repo '$projName' na GitHub ($mode)..."
    gh repo create $projName $mode --source . --remote origin --push --yes
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Nie udało się utworzyć repo. Sprawdź `gh auth login`."
        Pop-Location; exit 1
    }
    Write-Host "Utworzono zdalne origin i wypchnięto początkowy commit."
}

# 7. Stage & commit
git add .
$commitMsg = "Auto‑commit $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git commit -m $commitMsg 2>$null
Write-Host "Commit: $commitMsg"

# 8. Pull & rebase
git pull --rebase origin $Branch --allow-unrelated-histories 2>$null

# 9. Push
git push -u origin $Branch
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Wypchnięto na origin/$Branch"
} else {
    Write-Error "❌ Błąd push. Sprawdź uprawnienia."
    Pop-Location; exit 1
}

# 10. Przywróć poprzedni katalog
Pop-Location
