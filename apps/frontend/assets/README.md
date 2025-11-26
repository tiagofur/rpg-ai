# 🎨 Assets - RPG-AI Supreme

## Iconos y Logos

| Archivo             | Dimensiones | Uso                             | Estado               |
| ------------------- | ----------- | ------------------------------- | -------------------- |
| `logo.svg`          | 512x512     | Logo principal vectorial        | ✅ Placeholder       |
| `app-icon.svg`      | 1024x1024   | Icono para tiendas (fuente SVG) | ✅ Placeholder       |
| `icon.png`          | 1024x1024   | Icono de app (Expo)             | 📝 Generar desde SVG |
| `adaptive-icon.png` | 1024x1024   | Android adaptive icon           | 📝 Generar desde SVG |
| `splash-icon.png`   | 200x200     | Splash screen icon              | 📝 Generar desde SVG |
| `favicon.png`       | 48x48       | Web favicon                     | 📝 Generar desde SVG |

## Generación de PNGs desde SVG

### Usando Inkscape (CLI)

```bash
# Instalar Inkscape si no está instalado
# Windows: choco install inkscape
# Mac: brew install inkscape

# Generar icon.png (1024x1024)
inkscape assets/app-icon.svg -w 1024 -h 1024 -o assets/icon.png

# Generar adaptive-icon.png
inkscape assets/app-icon.svg -w 1024 -h 1024 -o assets/adaptive-icon.png

# Generar splash-icon.png (200x200)
inkscape assets/logo.svg -w 200 -h 200 -o assets/splash-icon.png

# Generar favicon.png (48x48)
inkscape assets/logo.svg -w 48 -h 48 -o assets/favicon.png
```

### Usando sharp (Node.js)

```bash
# Instalar sharp
npm install -g sharp-cli

# O usar el script generate-icons.js
node scripts/generate-icons.js
```

### Usando herramientas online

- [SVG to PNG Converter](https://svgtopng.com/)
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Convertio](https://convertio.co/svg-png/)

## Diseño del Logo

El logo de RPG-AI Supreme combina:

1. **Escudo Medieval** - Representa la protección y aventura del RPG
2. **D20 (Icosaedro)** - El dado clásico de juegos de rol
3. **Nodos de IA** - Red neuronal simbolizando la inteligencia artificial
4. **Colores Dorados** - Esquema premium con gradiente #f7cf46 → #ffd700 → #b8982f
5. **Fondo Oscuro** - #050510 para contraste y estética "dark mode"

## Paleta de Colores

| Color        | Hex       | Uso                   |
| ------------ | --------- | --------------------- |
| Gold Primary | `#f7cf46` | Elementos principales |
| Gold Bright  | `#ffd700` | Highlights            |
| Gold Dark    | `#b8982f` | Sombras y gradientes  |
| Background   | `#050510` | Fondo principal       |
| Surface      | `#0a0a1a` | Superficies elevadas  |

## Requisitos de Tiendas

### Apple App Store

- Icono: 1024x1024 PNG, sin transparencia, sin esquinas redondeadas (iOS las añade)
- Sin capas alfa, RGB color space

### Google Play Store

- Icono: 512x512 PNG, puede tener transparencia
- Icono Adaptivo: 108x108dp con safe zone de 72x72dp

### Expo Requirements

- `icon.png`: 1024x1024, usado para builds
- `adaptive-icon.png`: 1024x1024, para Android adaptive icons
- `splash-icon.png`: Se centra en splash screen
- `favicon.png`: Para web builds

## Fuentes Tipográficas

- **Títulos**: Cinzel Bold (serif medieval)
- **Fallback**: Georgia, serif

## Sonidos

Ver `assets/sounds/README.md` para documentación de audio.

---

> ⚠️ **NOTA**: Los archivos SVG actuales son placeholders. Para producción, contratar diseñador o usar herramientas
> como:
>
> - Figma/Sketch para diseño vectorial
> - Midjourney/DALL-E para conceptos
> - Fiverr/99designs para diseño profesional
