# 🎵 Sound Assets

Coloca tus efectos de sonido aquí (formato .mp3 o .ogg)

## 📋 Archivos Necesarios (Prioridad Alta)

### Efectos de Sonido (SFX)

- `click.mp3` - Click en botones
- `attack.mp3` - Ataque normal
- `hit.mp3` - Golpe exitoso
- `levelup.mp3` - Subida de nivel
- `death.mp3` - Muerte
- `success.mp3` - Acción exitosa

### Música Ambiental (BGM)

- `ambient_exploration.mp3` - Música de exploración (30-60s, loop)
- `ambient_combat.mp3` - Música de combate (30-60s, loop)

## 🎮 Uso en el Código

### Efectos de Sonido

```typescript
import { useGameEffects } from '../hooks/useGameEffects';

const { playSound, playHaptic } = useGameEffects();
await playSound('attack');
```

### Música Ambiental

```typescript
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';

const { playTrack, stopMusic } = useBackgroundMusic();
await playTrack('exploration'); // Fade in exploration music
await playTrack('combat'); // Crossfade to combat music
await stopMusic(); // Fade out
```

## 🌐 Fuentes Recomendadas (Libres de Derechos)

- **Freesound.org**: https://freesound.org (CC0, CC-BY)
- **OpenGameArt.org**: https://opengameart.org (CC0, CC-BY, GPL)
- **Mixkit**: https://mixkit.co/free-sound-effects/game/ (Gratis sin atribución)
- **Zapsplat**: https://www.zapsplat.com (Gratuita con atribución)

## 🛠️ Generadores de Sonidos Sintéticos

Para prototipado rápido:

- **jsfxr**: https://sfxr.me/ (Sonidos retro 8-bit)
- **Bfxr**: https://www.bfxr.net/ (Efectos de juego)

## 📝 Guía Completa

Ver: `docs/AUDIO_ASSETS_GUIDE.md` para instrucciones detalladas sobre:

- Cómo descargar y convertir assets
- Especificaciones técnicas
- Lista completa de sonidos necesarios
- Música de fondo
- Atribuciones

## ⚙️ Una vez que tengas los archivos:

1. Copia los archivos .mp3 a esta carpeta
2. Edita `src/hooks/useGameEffects.ts`
3. Descomenta las líneas de `require()` para cada sonido
4. ¡Listo! Los sonidos se cargarán automáticamente
