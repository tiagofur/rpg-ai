# Script para Descargar y Configurar Assets de Audio
# RPG-AI Supreme
# Última actualización: 2025-11-25

param(
    [switch]$UseOnlineGenerator,
    [switch]$SkipDownload,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Colores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Show-Help {
    Write-Host @"
=================================================
  🎵 RPG-AI Audio Assets Setup Script
=================================================

USO:
  .\setup-audio-assets.ps1 [opciones]

OPCIONES:
  -UseOnlineGenerator    Usar generador online (jsfxr) para crear sonidos sintéticos
  -SkipDownload          Solo configurar archivos existentes, no descargar
  -Help                  Mostrar esta ayuda

EJEMPLOS:
  # Modo interactivo (recomendado)
  .\setup-audio-assets.ps1

  # Usar generador online
  .\setup-audio-assets.ps1 -UseOnlineGenerator

  # Solo configurar archivos existentes
  .\setup-audio-assets.ps1 -SkipDownload

REQUISITOS:
  - PowerShell 5.1 o superior
  - Conexión a Internet (para descargar)
  - ffmpeg (opcional, para conversión)

FUENTES DE AUDIO:
  1. Freesound.org (CC0, CC-BY)
  2. Mixkit.co (Gratis sin atribución)
  3. OpenGameArt.org (Varias licencias)
  4. jsfxr (Generador sintético)

NOTAS:
  - Los archivos se descargarán a: apps/frontend/assets/sounds/
  - El código se actualizará en: apps/frontend/src/hooks/useGameEffects.ts
  - Revisa las licencias de los assets descargados

=================================================
"@
    exit 0
}

if ($Help) {
    Show-Help
}

Write-ColorOutput Green @"

=================================================
  🎵 RPG-AI Supreme - Audio Assets Setup
=================================================

"@

# Rutas
$projectRoot = Split-Path -Parent $PSScriptRoot
$soundsDir = Join-Path $projectRoot "apps\frontend\assets\sounds"
$hookFile = Join-Path $projectRoot "apps\frontend\src\hooks\useGameEffects.ts"

# Verificar que existen las carpetas
if (-not (Test-Path $soundsDir)) {
    Write-ColorOutput Red "❌ Error: No se encontró la carpeta de sonidos"
    Write-Host "Ruta esperada: $soundsDir"
    exit 1
}

Write-ColorOutput Cyan "📁 Carpeta de sonidos: $soundsDir"
Write-Host ""

# Lista de sonidos necesarios
$sounds = @(
    @{Name="click"; Desc="Click en botón"; Priority="ALTA"; Url="https://freesound.org/s/140910/"},
    @{Name="attack"; Desc="Ataque normal"; Priority="ALTA"; Url="https://freesound.org/s/277403/"},
    @{Name="hit"; Desc="Golpe exitoso"; Priority="ALTA"; Url="https://freesound.org/s/513919/"},
    @{Name="levelup"; Desc="Subida de nivel"; Priority="ALTA"; Url="https://freesound.org/s/270319/"},
    @{Name="death"; Desc="Muerte"; Priority="MEDIA"; Url="https://freesound.org/s/235968/"},
    @{Name="success"; Desc="Éxito/Recompensa"; Priority="MEDIA"; Url="https://freesound.org/s/270324/"}
)

Write-ColorOutput Yellow "📋 Sonidos Necesarios:"
Write-Host ""
foreach ($sound in $sounds) {
    $file = "$($sound.Name).mp3"
    $path = Join-Path $soundsDir $file
    $exists = Test-Path $path
    
    $status = if ($exists) { "✅" } else { "❌" }
    $priority = $sound.Priority
    $color = if ($priority -eq "ALTA") { "Red" } else { "Yellow" }
    
    Write-Host "  $status $file" -NoNewline
    Write-Host " - $($sound.Desc)" -NoNewline
    Write-ColorOutput $color " [$priority]"
}

Write-Host ""

# Contar archivos existentes
$existingCount = ($sounds | Where-Object { Test-Path (Join-Path $soundsDir "$($_.Name).mp3") }).Count
$totalCount = $sounds.Count

Write-ColorOutput Cyan "📊 Progreso: $existingCount/$totalCount archivos presentes"
Write-Host ""

# Si todos existen, preguntar si continuar
if ($existingCount -eq $totalCount -and -not $SkipDownload) {
    Write-ColorOutput Green "✅ Todos los archivos de audio ya existen!"
    $response = Read-Host "¿Deseas volver a descargarlos? (s/N)"
    if ($response -ne 's' -and $response -ne 'S') {
        Write-ColorOutput Cyan "👍 Configurando archivos existentes..."
        $SkipDownload = $true
    }
}

# Función para verificar ffmpeg
function Test-FFmpeg {
    try {
        $null = ffmpeg -version 2>&1
        return $true
    } catch {
        return $false
    }
}

if (-not $SkipDownload) {
    Write-ColorOutput Yellow @"
=================================================
  📥 DESCARGA DE ASSETS
=================================================

Para obtener los archivos de audio, tienes 3 opciones:

1. 🌐 MANUAL (Recomendado para producción)
   - Visita las URLs listadas abajo
   - Descarga sonidos de alta calidad
   - Renombra a: nombre.mp3
   - Copia a: $soundsDir

2. 🤖 GENERADOR SINTÉTICO (Para prototipado)
   - Usa jsfxr.me para crear sonidos 8-bit
   - Rápido pero calidad básica
   - Ejecuta: .\setup-audio-assets.ps1 -UseOnlineGenerator

3. ⏭️  OMITIR (Ya los tienes)
   - Ejecuta: .\setup-audio-assets.ps1 -SkipDownload

=================================================

"@

    if ($UseOnlineGenerator) {
        Write-ColorOutput Cyan "🤖 Abriendo generador de sonidos sintéticos..."
        Write-Host ""
        Write-Host "Instrucciones:"
        Write-Host "  1. Se abrirá jsfxr en tu navegador"
        Write-Host "  2. Haz click en 'Randomize' hasta encontrar un sonido que te guste"
        Write-Host "  3. Exporta como WAV"
        Write-Host "  4. Renombra y guarda en: $soundsDir"
        Write-Host "  5. Repite para cada sonido"
        Write-Host ""
        
        Start-Process "https://sfxr.me/"
        
        Read-Host "Presiona ENTER cuando hayas descargado los archivos..."
    } else {
        Write-ColorOutput Yellow "📝 URLs para Descargar (Freesound.org):"
        Write-Host ""
        
        foreach ($sound in $sounds) {
            Write-Host "  • $($sound.Name).mp3 - $($sound.Desc)"
            Write-Host "    $($sound.Url)"
            Write-Host ""
        }
        
        Write-ColorOutput Cyan "💡 TIP: También puedes buscar alternativas en:"
        Write-Host "  - https://mixkit.co/free-sound-effects/game/"
        Write-Host "  - https://opengameart.org/"
        Write-Host "  - https://www.zapsplat.com/"
        Write-Host ""
        
        $response = Read-Host "¿Abrir Freesound.org en el navegador? (S/n)"
        if ($response -ne 'n' -and $response -ne 'N') {
            foreach ($sound in $sounds | Where-Object { $_.Priority -eq "ALTA" }) {
                Start-Process $sound.Url
                Start-Sleep -Milliseconds 500
            }
        }
        
        Write-Host ""
        Write-ColorOutput Yellow "⏸️  Descarga los archivos y guárdalos como .mp3 en:"
        Write-Host "   $soundsDir"
        Write-Host ""
        Read-Host "Presiona ENTER cuando hayas descargado los archivos..."
    }
}

# Verificar archivos nuevamente
Write-Host ""
Write-ColorOutput Cyan "🔍 Verificando archivos descargados..."
Write-Host ""

$updated = @()
foreach ($sound in $sounds) {
    $file = "$($sound.Name).mp3"
    $path = Join-Path $soundsDir $file
    if (Test-Path $path) {
        $size = (Get-Item $path).Length / 1KB
        Write-ColorOutput Green "  ✅ $file ($([math]::Round($size, 2)) KB)"
        $updated += $sound.Name
    } else {
        Write-ColorOutput Red "  ❌ $file (falta)"
    }
}

Write-Host ""

# Si no hay ningún archivo, salir
if ($updated.Count -eq 0) {
    Write-ColorOutput Red "❌ No se encontraron archivos de audio."
    Write-Host "Por favor, descarga al menos un archivo y vuelve a ejecutar el script."
    exit 1
}

# Actualizar useGameEffects.ts
Write-ColorOutput Cyan "📝 Actualizando useGameEffects.ts..."

$hookContent = Get-Content $hookFile -Raw

# Preparar nuevo contenido
$newSoundFiles = @"
const SOUND_FILES: Record<string, number | undefined> = {
"@

foreach ($sound in $sounds) {
    if ($updated -contains $sound.Name) {
        $newSoundFiles += "`n    $($sound.Name): require('../../assets/sounds/$($sound.Name).mp3'),"
    } else {
        $newSoundFiles += "`n    // $($sound.Name): require('../../assets/sounds/$($sound.Name).mp3'),"
    }
}

$newSoundFiles += "`n};"

# Reemplazar en el archivo
$pattern = '(?s)const SOUND_FILES:.*?\};'
$hookContent = $hookContent -replace $pattern, $newSoundFiles

Set-Content $hookFile -Value $hookContent -NoNewline

Write-ColorOutput Green "✅ Archivo actualizado!"
Write-Host ""

# Resumen final
Write-ColorOutput Green @"

=================================================
  ✅ SETUP COMPLETADO
=================================================

📊 Resumen:
  - Archivos configurados: $($updated.Count)/$totalCount
  - Hook actualizado: useGameEffects.ts

🎵 Sonidos activos:
"@

foreach ($name in $updated) {
    Write-Host "  ✅ $name"
}

if ($updated.Count -lt $totalCount) {
    Write-Host ""
    Write-ColorOutput Yellow "⚠️  Sonidos pendientes:"
    foreach ($sound in $sounds) {
        if ($updated -notcontains $sound.Name) {
            Write-Host "  ❌ $($sound.Name)"
        }
    }
}

Write-Host ""
Write-ColorOutput Cyan "🚀 Próximos pasos:"
Write-Host "  1. Ejecuta la app: cd apps/frontend && npm run start"
Write-Host "  2. Prueba los sonidos en la configuración"
Write-Host "  3. Ajusta el volumen si es necesario"
Write-Host ""

Write-ColorOutput Green "✅ ¡Listo para jugar con audio!"
Write-Host ""
Write-Host "==================================================="
