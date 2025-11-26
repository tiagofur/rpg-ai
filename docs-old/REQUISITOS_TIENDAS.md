# 🏪 RPG-AI SUPREME - Requisitos para Tiendas

> **Checklist completo para lanzar en Google Play, Apple App Store, Steam y Microsoft Store**

---

## 📱 GOOGLE PLAY STORE

### Información Básica

- [ ] **Nombre de la app:** RPG-AI Supreme (máx 30 caracteres)
- [ ] **Descripción corta:** máx 80 caracteres
- [ ] **Descripción completa:** máx 4,000 caracteres
- [ ] **Categoría:** Juegos > Rol
- [ ] **Tags:** RPG, IA, Narrativo, Texto, Aventura

### Assets Gráficos

| Asset                  | Tamaño                    | Estado |
| ---------------------- | ------------------------- | ------ |
| Icono                  | 512x512 PNG               | ❌     |
| Feature Graphic        | 1024x500 PNG/JPG          | ❌     |
| Screenshots teléfono   | 320-3840px (16:9 o 9:16)  | ❌     |
| Screenshots tablet 7"  | Opcional pero recomendado | ❌     |
| Screenshots tablet 10" | Opcional pero recomendado | ❌     |
| Video promocional      | YouTube URL               | ❌     |

### Requisitos Técnicos

- [ ] **Target SDK:** API 34 (Android 14) - requerido 2024+
- [ ] **Min SDK:** API 24 (Android 7.0) recomendado
- [ ] **64-bit:** APK/AAB debe incluir arm64-v8a
- [ ] **App Bundle:** Formato AAB preferido sobre APK
- [ ] **Firma:** Firmado con tu keystore (¡GUARDA EL KEYSTORE!)
- [ ] **Permisos:** Justificar cada permiso solicitado

### Políticas Requeridas

- [ ] **Política de Privacidad:** URL pública obligatoria
- [ ] **Contenido generado por IA:** Declarar uso de IA
- [ ] **Compras in-app:** Declarar y detallar
- [ ] **Anuncios:** Declarar si hay (nosotros no tenemos)
- [ ] **Datos recopilados:** Cuestionario de seguridad de datos

### Clasificación de Contenido

- [ ] **IARC Rating:** Completar cuestionario
- [ ] **Violencia:** Declarar nivel (fantasy violence)
- [ ] **Contenido sexual:** Ninguno
- [ ] **Lenguaje:** Puede haber texto moderado
- [ ] **Rating esperado:** PEGI 12 / ESRB T

### Configuración de Cuenta

- [ ] **Google Play Console:** Cuenta de desarrollador ($25 una vez)
- [ ] **Merchant account:** Para recibir pagos
- [ ] **Información fiscal:** W-8BEN o equivalente

### Links Útiles

- [Google Play Console](https://play.google.com/console)
- [Políticas de desarrollador](https://play.google.com/about/developer-content-policy/)
- [Guía de assets gráficos](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Requisitos de Target SDK](https://developer.android.com/google/play/requirements/target-sdk)

---

## 🍎 APPLE APP STORE

### Información Básica

- [ ] **Nombre:** RPG-AI Supreme (máx 30 caracteres)
- [ ] **Subtítulo:** máx 30 caracteres
- [ ] **Descripción:** máx 4,000 caracteres
- [ ] **Palabras clave:** máx 100 caracteres, separadas por coma
- [ ] **URL de soporte:** Requerido
- [ ] **URL de marketing:** Opcional
- [ ] **Categoría primaria:** Games > Role Playing
- [ ] **Categoría secundaria:** Entertainment

### Assets Gráficos

| Asset               | Dispositivo    | Tamaño        | Estado |
| ------------------- | -------------- | ------------- | ------ |
| Icono               | Todos          | 1024x1024 PNG | ❌     |
| Screenshots         | iPhone 6.7"    | 1290x2796     | ❌     |
| Screenshots         | iPhone 6.5"    | 1284x2778     | ❌     |
| Screenshots         | iPhone 5.5"    | 1242x2208     | ❌     |
| Screenshots         | iPad Pro 12.9" | 2048x2732     | ❌     |
| App Preview (video) | Varios         | 30 seg máx    | ❌     |

### Requisitos Técnicos

- [ ] **iOS mínimo:** iOS 15.0 recomendado
- [ ] **Arquitectura:** arm64 obligatorio
- [ ] **Bitcode:** Ya no requerido (iOS 16+)
- [ ] **SwiftUI/UIKit:** Compatible
- [ ] **Expo EAS Build:** Configurar para iOS

### App Store Review Guidelines

- [ ] **4.2 Minimum Functionality:** El app debe funcionar
- [ ] **3.1.1 In-App Purchase:** Usar sistema de Apple para compras
- [ ] **5.1 Privacy:** Política de privacidad requerida
- [ ] **1.2 User Generated Content:** Moderación si hay UGC
- [ ] **5.6.1 App Tracking Transparency:** Si usas tracking

### Privacy Nutrition Labels

Declarar qué datos recopilamos:

- [ ] **Identificadores:** ID de usuario
- [ ] **Datos de uso:** Gameplay analytics
- [ ] **Información de contacto:** Email
- [ ] **Compras:** Historial de suscripciones
- [ ] **Diagnósticos:** Crash logs

### Configuración de Cuenta

- [ ] **Apple Developer Program:** $99/año
- [ ] **App Store Connect:** Crear app
- [ ] **Certificados y provisioning profiles**
- [ ] **Información bancaria y fiscal**

### TestFlight (Beta Testing)

- [ ] **Internal Testing:** Hasta 100 testers (equipo)
- [ ] **External Testing:** Hasta 10,000 testers (requiere review)
- [ ] **Beta App Review:** 24-48 horas primera vez

### Links Útiles

- [App Store Connect](https://appstoreconnect.apple.com)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Screenshot specifications](https://help.apple.com/app-store-connect/#/devd274dd925)

---

## 🎮 STEAM

### Información Básica

- [ ] **Nombre:** RPG-AI Supreme
- [ ] **Descripción corta:** máx 300 caracteres
- [ ] **Descripción larga:** Sin límite, HTML soportado
- [ ] **Género:** RPG, Indie, Early Access (si aplica)
- [ ] **Tags:** hasta 20 tags populares
- [ ] **Idiomas:** Listar idiomas soportados
- [ ] **Requisitos de sistema:** Mínimos y recomendados

### Assets Gráficos

| Asset           | Tamaño           | Uso                   | Estado |
| --------------- | ---------------- | --------------------- | ------ |
| Header Capsule  | 460x215          | Biblioteca, búsquedas | ❌     |
| Small Capsule   | 231x87           | Listas pequeñas       | ❌     |
| Main Capsule    | 616x353          | Página de tienda      | ❌     |
| Hero Capsule    | 3840x1240        | Header grande         | ❌     |
| Logo            | PNG transparente | Sobre artwork         | ❌     |
| Library Capsule | 600x900          | Biblioteca vertical   | ❌     |
| Library Hero    | 3840x1240        | Fondo biblioteca      | ❌     |
| Screenshots     | 1920x1080 mín    | Al menos 5            | ❌     |
| Trailer         | 1080p mín        | Obligatorio           | ❌     |

### Requisitos Técnicos

- [ ] **Steamworks SDK:** Integrar para logros, cloud saves
- [ ] **Plataformas:** Windows obligatorio, Mac/Linux opcional
- [ ] **32-bit y 64-bit:** Recomendado ambos
- [ ] **Controller support:** Declarar si hay
- [ ] **Steam Deck:** Verificar compatibilidad

### Features de Steam

- [ ] **Logros:** Definir lista de achievements
- [ ] **Trading Cards:** Opcional, requiere arte adicional
- [ ] **Cloud Saves:** Configurar Steam Cloud
- [ ] **Leaderboards:** Si aplica
- [ ] **Workshop:** Si hay mods

### Configuración de Cuenta

- [ ] **Steamworks Partner:** Registrarse
- [ ] **App ID:** Crear nueva aplicación ($100 por app)
- [ ] **Información bancaria y fiscal**
- [ ] **Coming Soon page:** Se puede crear antes del launch

### Proceso de Release

1. [ ] Crear app en Steamworks
2. [ ] Subir builds a depots
3. [ ] Configurar página de tienda
4. [ ] Subir assets gráficos
5. [ ] Configurar precios
6. [ ] Review de Valve (días a semanas)
7. [ ] Coming Soon → Release

### Links Útiles

- [Steamworks](https://partner.steamgames.com)
- [Steamworks Documentation](https://partner.steamgames.com/doc/home)
- [Asset Templates](https://partner.steamgames.com/doc/store/assets)
- [Release Process](https://partner.steamgames.com/doc/store/release)

---

## 🪟 MICROSOFT STORE

### Información Básica

- [ ] **Nombre:** RPG-AI Supreme
- [ ] **Descripción corta:** 100 caracteres
- [ ] **Descripción:** 10,000 caracteres máx
- [ ] **Categoría:** Games > Role Playing
- [ ] **Palabras clave:** Para búsqueda

### Assets Gráficos

| Asset       | Tamaño       | Estado |
| ----------- | ------------ | ------ |
| Store logo  | 300x300      | ❌     |
| Poster art  | 720x1080     | ❌     |
| Hero art    | 1920x1080    | ❌     |
| Screenshots | 1366x768 mín | ❌     |
| Trailer     | 1080p        | ❌     |

### Requisitos Técnicos

- [ ] **Formato:** MSIX o APPX
- [ ] **Windows mínimo:** Windows 10 1903+
- [ ] **Arquitecturas:** x64 y ARM64 recomendado
- [ ] **Certificación:** Pasar Windows App Certification Kit

### Configuración de Cuenta

- [ ] **Microsoft Partner Center:** Cuenta de desarrollador
- [ ] **Costo:** $19 individual / $99 empresa (una vez)
- [ ] **Información bancaria y fiscal**

### Links Útiles

- [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
- [App submission requirements](https://docs.microsoft.com/windows/uwp/publish/)
- [Store policies](https://docs.microsoft.com/windows/uwp/publish/store-policies)

---

## 📋 CHECKLIST GLOBAL PRE-LANZAMIENTO

### Documentos Legales

- [ ] **Política de Privacidad** - URL pública
  - Datos que recopilamos
  - Uso de IA y datos de conversación
  - Derechos GDPR/CCPA
  - Contacto para solicitudes
- [ ] **Términos de Servicio** - URL pública
  - Uso aceptable del servicio
  - Política de suscripciones
  - Reembolsos
  - Contenido generado
  - Limitación de responsabilidad

- [ ] **EULA** (Steam especialmente)

### Assets Universales Necesarios

- [ ] **Logo** - múltiples resoluciones y fondos
- [ ] **Icono** - 1024x1024 master
- [ ] **Screenshots** - 5+ mostrando gameplay real
- [ ] **Trailer** - 30-90 segundos, gameplay + features
- [ ] **Feature graphic/Hero** - arte promocional grande
- [ ] **Press Kit** - ZIP con todo lo anterior + descripciones

### Testing Pre-Submit

- [ ] **Funcionalidad:** Todas las features funcionan
- [ ] **Crashes:** 0 crashes en flujo principal
- [ ] **Pagos:** Compras funcionan en modo producción
- [ ] **Offline:** Manejo graceful sin internet
- [ ] **Orientación:** Portrait/Landscape correctos
- [ ] **Idiomas:** Todos los strings traducidos

### Información de Contacto

- [ ] **Email de soporte:** support@rpgaisupreme.com
- [ ] **Website:** https://rpgaisupreme.com
- [ ] **Social:** Twitter/X, Discord (para comunidad)

---

## 🎯 Prioridad de Tiendas

| Tienda              | Audiencia      | Prioridad | Razón                         |
| ------------------- | -------------- | --------- | ----------------------------- |
| **Google Play**     | Masiva         | 🔴 Alta   | Mayor alcance, Android domina |
| **Apple App Store** | Premium        | 🔴 Alta   | Usuarios pagan más            |
| **Steam**           | Gamers PC      | 🟡 Media  | Comunidad fuerte RPG          |
| **Microsoft Store** | Windows casual | 🟢 Baja   | Menor tráfico                 |

**Recomendación:** Lanzar primero en **Google Play + Apple App Store**, luego Steam, finalmente Microsoft Store.

---

## 💡 Tips de Optimización ASO (App Store Optimization)

### Keywords Research

- "RPG AI"
- "Text adventure"
- "AI game"
- "Story generator"
- "D&D AI"
- "Solo RPG"
- "AI dungeon alternative"

### Mejores Prácticas

1. **Icono:** Memorable, legible en 64x64
2. **Screenshots:** Primeras 2 son las más importantes
3. **Descripción:** Keywords al inicio
4. **Ratings:** Pedir review después de momentos positivos
5. **Updates:** Actualizar regularmente mejora ranking

---

> 📝 **Nota:** Este documento se actualizará con los requisitos específicos una vez tengamos los assets listos.
