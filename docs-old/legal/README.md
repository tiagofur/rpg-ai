# Documentación Legal - RPG-AI Supreme

Esta carpeta contiene los documentos legales requeridos para la publicación en tiendas de aplicaciones y cumplimiento
normativo.

## Documentos Incluidos

### Política de Privacidad

- `privacy-policy.md` - Versión en español
- `privacy-policy-en.md` - Versión en inglés

### Términos de Servicio

- `terms-of-service.md` - Versión en español
- `terms-of-service-en.md` - Versión en inglés

## URLs Públicas Requeridas

Para cumplir con los requisitos de las tiendas, estos documentos deben estar disponibles en URLs públicas:

| Documento              | URL Español               | URL Inglés                   |
| ---------------------- | ------------------------- | ---------------------------- |
| Política de Privacidad | https://rpgai.app/privacy | https://rpgai.app/en/privacy |
| Términos de Servicio   | https://rpgai.app/terms   | https://rpgai.app/en/terms   |

## Requisitos por Tienda

### Apple App Store

- ✅ Política de Privacidad (obligatoria)
- ✅ Términos de Servicio (recomendado)
- URL de política requerida en App Store Connect
- Debe describir prácticas de datos (App Privacy Labels)

### Google Play Store

- ✅ Política de Privacidad (obligatoria desde 2021)
- ✅ Términos de Servicio (recomendado)
- URL de política requerida en Play Console
- Data Safety section requerida

## Integración en la App

Los documentos están enlazados desde:

- `SettingsScreen.tsx` → botones "Privacy Policy" y "Terms of Service"
- URLs configuradas: `https://rpgai.app/privacy` y `https://rpgai.app/terms`

## Próximos Pasos

1. **Hosting:** Subir documentos a servidor web público
2. **App Store Connect:** Configurar URL de política de privacidad
3. **Play Console:** Configurar Data Safety y URL de política
4. **In-App:** Verificar que los enlaces funcionen correctamente

## Notas Legales

⚠️ **Importante:** Estos documentos son plantillas y deben ser revisados por un profesional legal antes del lanzamiento
público. Considere:

- Adaptación a jurisdicciones específicas
- Cumplimiento con GDPR (Europa)
- Cumplimiento con CCPA (California)
- Leyes locales de protección de menores
- Regulaciones específicas de juegos y compras in-app

## Última Actualización

- Versión: 1.0
- Fecha: 26 de noviembre de 2025
- Próxima revisión recomendada: Antes del lanzamiento o cuando cambien funcionalidades significativas
