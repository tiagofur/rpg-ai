```markdown
# Arquitectura propuesta (alto nivel)

Componentes principales
- Frontend (cliente): UI React (image display, story log, input, panel de personaje).
- Backend (authoritative): API REST + WebSocket para gestión de partidas, resolución de acciones y control de prompts.
- AI Gateway: servicio que normaliza las llamadas a proveedores LLM / Imagen (cola, ratelimiting, caching).
- Storage: DB para partidas, personajes y assets; Vector DB para memoria semántica.
- Worker(s): procesos que consumen jobs para generar imágenes/audio y pre-render prompts costosos.

Flujo de una acción del jugador (MVP)
1. El jugador envía acción -> frontend -> websocket POST a servidor.
2. Servidor valida/parsea entrada, actualiza log de la partida.
3. Servidor consulta la "Hoja de Personaje" y contexto.
4. Servidor decide dificultad y calcula probabilidad.
5. Servidor realiza tirada interna (seedable RNG).
6. Servidor genera la narración base (puede llamar al LLM con prompt de sistema + contexto + resultado de la tirada).
7. Si la acción dispara imagen, servidor crea prompt de imagen y encola job al AI Gateway.
8. Servidor envía al cliente: narración + nuevo estado + (si aplica) url de imagen cuando esté lista.

Sugerencias prácticas
- Mantén la lógica de juego en el servidor para evitar trampas.
- Implementa un sistema de "events" (event sourcing) simple para partidas — facilita replay y debug.
- Almacena prompts y respuestas del LLM (versión + id de modelo) para trazabilidad y reproducibilidad.
```