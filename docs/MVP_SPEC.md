```markdown
# Especificación técnica MVP (detallada)

Endpoints / Mensajes (resumen)
- POST /api/session/create -> crea una nueva partida / sesión.
- POST /api/character/create -> crea personaje conversacional.
- WS /socket -> canal para enviar acciones y recibir narración/estado/imágenes.
- GET /api/image/:id -> recupera imagen generada (CDN).

Formato JSON: Hoja de Personaje (simplificada)
{
  "id":"uuid",
  "nombre":"Aún no definido",
  "raza":"Elfo",
  "clase":"Pícaro",
  "atributos":{"Agilidad":"Alta","Fuerza":"Baja","Carisma":"Media"},
  "habilidades":["Sigilo","Juego de Manos","Acrobacias"],
  "inventario":["Dos Dagas","Ropa de cuero","Ganzúas"],
  "estado":"Saludable",
  "seed": 1234567890
}

Protocolo de resolución (pseudocódigo)
1. recibirAccion(textoAccion, playerId, sessionId)
2. contexto = cargarContexto(sessionId)
3. parse = parsearIntencion(textoAccion) // NLP ligero
4. relevantes = encontrarHabilidades(parse, personaje)
5. dificultad = estimarDificultad(contexto, parse)
6. probBase = mapearAprobabilidad(atributos, relevantes, dificultad)
7. resultado = tirarRNG(personaje.seed, contexto.turno)
8. efecto = aplicarReglas(resultado, parse, personaje)
9. narracion = pedirNarracionALLM(systemPrompt, contexto, parse, resultado, efecto)
10. si disparadorImagen(narracion, efecto): encolarGeneracionImagen(promptImagen)
11. actualizarEstadoDB(sessionId, efecto)
12. emitirAlCliente(narracion, nuevoEstado, imageJobId)

Sistema de RNG
- Usa un RNG seedable por sesión/partida (para reproducibilidad).
- Guarda la semilla en la partida para permitir replay.

Prompt sistema (resumen)
- Rol: "Eres el Director de Juego (DJ) — justo, descriptivo, creativo."
- Normas: no decir "no", en su lugar describir consecuencias; priorizar coherencia del mundo; indicar si debe generarse imagen (y crear prompt de imagen).
- Output: JSON mínimo con keys: narration (texto), stateChanges (objeto), imagePrompt (opcional string), imageTrigger (boolean).

Ejemplo de prompt de imagen (plantilla)
"Retrato de un pícaro elfo con dos dagas en un tejado nocturno, luz de luna, estilo arte conceptual de fantasía — alta resolución, tonos fríos, pose sigilosa, detalles: ojos verdes, capa oscura, brillo metálico en las dagas."

Seguridad y moderación
- Filtrar entradas del jugador antes de enviarlas al LLM.
- Limitar generación de imágenes que contengan personas reales o contenido sensible.
```