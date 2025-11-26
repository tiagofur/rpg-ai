# 🎵 Guía de Assets de Audio - RPG-AI Supreme

> **Última actualización:** 25 de Noviembre 2025

---

## 📋 Assets de Audio Necesarios

### 🎮 Sonidos de Interfaz (UI)

| Archivo       | Uso                    | Duración | Formato |
| ------------- | ---------------------- | -------- | ------- |
| `click.mp3`   | Clicks en botones      | ~100ms   | MP3/OGG |
| `hover.mp3`   | Hover sobre elementos  | ~50ms    | MP3/OGG |
| `success.mp3` | Acción exitosa         | ~300ms   | MP3/OGG |
| `error.mp3`   | Error o acción fallida | ~300ms   | MP3/OGG |

### ⚔️ Sonidos de Combate

| Archivo        | Uso                 | Duración | Formato |
| -------------- | ------------------- | -------- | ------- |
| `attack.mp3`   | Ataque normal       | ~400ms   | MP3/OGG |
| `hit.mp3`      | Golpe exitoso       | ~200ms   | MP3/OGG |
| `critical.mp3` | Golpe crítico       | ~500ms   | MP3/OGG |
| `miss.mp3`     | Ataque fallido      | ~250ms   | MP3/OGG |
| `block.mp3`    | Bloqueo             | ~300ms   | MP3/OGG |
| `death.mp3`    | Muerte de personaje | ~1.5s    | MP3/OGG |

### ✨ Sonidos de Eventos

| Archivo              | Uso               | Duración | Formato |
| -------------------- | ----------------- | -------- | ------- |
| `levelup.mp3`        | Subida de nivel   | ~2s      | MP3/OGG |
| `quest_complete.mp3` | Misión completada | ~1.5s    | MP3/OGG |
| `item_pickup.mp3`    | Recoger item      | ~300ms   | MP3/OGG |
| `coin.mp3`           | Obtener oro       | ~200ms   | MP3/OGG |
| `potion.mp3`         | Usar poción       | ~500ms   | MP3/OGG |
| `equip.mp3`          | Equipar item      | ~400ms   | MP3/OGG |

### 🎼 Música Ambiental (Opcional)

| Archivo                 | Uso            | Duración     | Formato |
| ----------------------- | -------------- | ------------ | ------- |
| `music_menu.mp3`        | Menú principal | ~2min (loop) | MP3     |
| `music_exploration.mp3` | Exploración    | ~3min (loop) | MP3     |
| `music_combat.mp3`      | Combate        | ~2min (loop) | MP3     |
| `music_victory.mp3`     | Victoria       | ~30s         | MP3     |
| `music_defeat.mp3`      | Derrota        | ~30s         | MP3     |

---

## 🌐 Fuentes de Audio Gratuitas (Libres de Derechos)

### 🎵 Efectos de Sonido

1. **Freesound.org** ⭐⭐⭐⭐⭐
   - URL: https://freesound.org
   - Licencias: CC0, CC-BY
   - Búsquedas recomendadas:
     - "sword swing"
     - "hit impact"
     - "button click"
     - "level up"
     - "coin pickup"

2. **OpenGameArt.org** ⭐⭐⭐⭐⭐
   - URL: https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=13
   - Licencias: CC0, CC-BY, GPL
   - Categorías:
     - Sound Effect > Fantasy
     - Sound Effect > UI

3. **Zapsplat** ⭐⭐⭐⭐
   - URL: https://www.zapsplat.com
   - Licencia: Gratuita con atribución
   - Categorías útiles:
     - Game Sounds
     - Fantasy & Sci-Fi
     - User Interface

4. **Mixkit** ⭐⭐⭐⭐
   - URL: https://mixkit.co/free-sound-effects/game/
   - Licencia: Gratis sin atribución
   - Gran calidad profesional

### 🎼 Música de Fondo

1. **Kevin MacLeod (Incompetech)** ⭐⭐⭐⭐⭐
   - URL: https://incompetech.com/music/royalty-free/
   - Licencia: CC-BY (requiere atribución)
   - Géneros recomendados:
     - Fantasy
     - Adventure
     - Dramatic

2. **Pixabay Music** ⭐⭐⭐⭐⭐
   - URL: https://pixabay.com/music/
   - Licencia: Gratuita sin atribución
   - Búsquedas:
     - "epic fantasy"
     - "medieval"
     - "adventure"

3. **Free Music Archive** ⭐⭐⭐⭐
   - URL: https://freemusicarchive.org
   - Licencias: Varias (verificar)
   - Género: Game

4. **Purple Planet Music** ⭐⭐⭐⭐
   - URL: https://www.purple-planet.com
   - Licencia: Gratuita con atribución
   - Categorías:
     - Fantasy & Medieval
     - Epic

---

## 🛠️ Herramientas para Crear Sonidos

### Generadores Online

1. **Sfxr / jsfxr** (Sonidos retro 8-bit)
   - URL: https://sfxr.me/
   - Perfecto para: Clicks, efectos UI simples

2. **ChipTone** (Sonidos chiptune)
   - URL: https://sfbgames.itch.io/chiptone
   - Perfecto para: Efectos de juego retro

3. **Bfxr** (Efectos de juego)
   - URL: https://www.bfxr.net/
   - Perfecto para: Todo tipo de SFX

### Software Profesional (Gratuito)

1. **Audacity**
   - URL: https://www.audacityteam.org/
   - Edición y procesamiento de audio

2. **LMMS**
   - URL: https://lmms.io/
   - Creación de música y efectos

---

## 📦 Instalación de Assets

### 1. Descargar y Preparar

```bash
# Crear carpeta temporal
mkdir temp_audio

# Descargar archivos (ejemplo con wget/curl)
# Renombrar según convención: nombre.mp3
```

### 2. Convertir a Formato Adecuado

```bash
# Instalar ffmpeg si no lo tienes
# Windows: winget install ffmpeg
# Mac: brew install ffmpeg
# Linux: sudo apt install ffmpeg

# Convertir a MP3 optimizado (si es necesario)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k -ar 44100 output.mp3

# Normalizar volumen
ffmpeg -i input.mp3 -af "loudnorm" output.mp3
```

### 3. Colocar en el Proyecto

```bash
# Copiar a la carpeta de assets
cp click.mp3 apps/frontend/assets/sounds/
cp attack.mp3 apps/frontend/assets/sounds/
cp hit.mp3 apps/frontend/assets/sounds/
# etc...
```

### 4. Habilitar en el Código

Editar `apps/frontend/src/hooks/useGameEffects.ts`:

```typescript
const SOUND_FILES: Record<string, number | undefined> = {
  click: require('../../assets/sounds/click.mp3'),
  attack: require('../../assets/sounds/attack.mp3'),
  hit: require('../../assets/sounds/hit.mp3'),
  levelUp: require('../../assets/sounds/levelup.mp3'),
  death: require('../../assets/sounds/death.mp3'),
  success: require('../../assets/sounds/success.mp3'),
};
```

---

## 🎨 Especificaciones Técnicas

### Formato Recomendado

- **Formato:** MP3 (mejor compatibilidad cross-platform)
- **Bitrate:** 128 kbps (balance calidad/tamaño)
- **Sample Rate:** 44.1 kHz
- **Canales:** Mono (para SFX), Estéreo (para música)

### Duración

- **Clicks/UI:** < 200ms
- **Efectos Cortos:** 200-500ms
- **Efectos Largos:** 500ms - 2s
- **Música:** 1-3 minutos (loop)

### Tamaño de Archivo

- **SFX individual:** < 50 KB
- **Música (loop):** < 2 MB
- **Total recomendado:** < 10 MB para todos los assets

---

## 📝 Atribuciones (Ejemplo)

Si usas assets con licencia CC-BY, añade al proyecto:

```markdown
## Audio Credits

- Sound Effects from Freesound.org:
  - "Sword Swing" by Artist123 (CC-BY 4.0)
  - "Level Up" by SoundDesigner99 (CC0)

- Music by Kevin MacLeod:
  - "Heroic Adventure" (CC-BY 4.0)
  - Link: https://incompetech.com
```

---

## ✅ Checklist de Implementación

- [ ] Descargar sonidos básicos (click, attack, hit, levelup)
- [ ] Convertir a MP3 128kbps si es necesario
- [ ] Copiar a `apps/frontend/assets/sounds/`
- [ ] Descomentar imports en `useGameEffects.ts`
- [ ] Probar en simulador/dispositivo
- [ ] Añadir más sonidos según necesidad
- [ ] Documentar atribuciones si es necesario
- [ ] Optimizar tamaño total de assets

---

## 🔧 Troubleshooting

### Sonido no se reproduce en iOS

```typescript
// Añadir al inicio de App.tsx
import { Audio } from 'expo-av';

await Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
});
```

### Sonido muy bajo o muy alto

```typescript
// Ajustar volumen al cargar
const { sound } = await Audio.Sound.createAsync(
  require('./sound.mp3'),
  { volume: 0.5 } // 0.0 a 1.0
);
```

### Lag al reproducir primera vez

- Los sonidos ya están precargados en `useGameEffects`
- Si hay lag, verificar que se están precargando correctamente en el `useEffect`

---

## 🎯 Prioridades

1. **🔴 CRÍTICO:**
   - click.mp3
   - attack.mp3
   - hit.mp3

2. **🟡 ALTO:**
   - levelup.mp3
   - death.mp3
   - success.mp3

3. **🟢 MEDIO:**
   - Resto de SFX
   - Música de fondo (opcional para MVP)

---

> 💡 **Tip:** Empieza con sonidos sintéticos simples de jsfxr para testear la funcionalidad, luego reemplaza con audio
> profesional cuando tengas tiempo.
