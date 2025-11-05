```markdown
# Documento de Diseño de Juego (GDD) — RPG Narrativo con IA

Versión: 0.2 — Especificación Detallada

1. Visión
----------
Ser el Dungeons & Dragons personal, visual e instantáneo: un TTRPG guiado por IA para solitario y multijugador, sin preparación previa y con fuerte énfasis en agencia del jugador.

2. Concepto central
-------------------
- IA como Director de Juego (IA-DJ).
- Mecánicas de juego reales (tiradas virtuales) gobernadas por atributos/habilidades del personaje.
- Generación de imágenes para momentos clave.
- Interfaz conversacional pero con resolución de acciones de juego (no solo generación de historias).

3. Pilares
----------
- Agencia absoluta del jugador (acciones en lenguaje natural).
- Narrativa emergente generada por IA.
- Inmersión visual con imágenes generadas dinámicamente.
- Mecánicas ligeras y reproducibles (estado, inventario, resolución de acciones).

4. MVP (Single Player) — Mecánicas
---------------------------------
- Creación de personaje conversacional -> IA genera JSON de hoja simplificada.
- Hoja visible: estado (cadena) e inventario.
- Resolución de acciones:
  - Entrada: acción en texto libre.
  - IA-DJ: determina dificultad, habilidades relevantes y resuelve internamente con un RNG con semilla.
  - Resultado: narración (éxito / fallo / parcial) y cambios de estado/inventario.
- Motor visual:
  - API: imagen-3.0-generate-002 (u otra).
  - Triggers definidos (inicio, creación de PJ, ubicación clave, NPC importante, objeto único, evento crítico).
  - IA-DJ construye prompts de imagen basados en su propia narración.

5. Flujo UI/UX (MVP)
--------------------
- Panel imagen (id="image-display")
- Panel narrativa / chat (id="story-log")
- Entrada de acciones (id="user-prompt")
- Panel personaje (state + inventario)

6. Multijugador (versión 1.5)
-----------------------------
- Sistema de "sala" 1-4 jugadores.
- IA-DJ como anfitrión y árbitro.
- Chat log compartido; turno gestionado por servidor.
- Mecanismo para privacidad en creación de PJ (privado -> público).

7. Evolución (v2.0+)
--------------------
- Hojas de personaje completas visibles y editables.
- Nivelación y progresión.
- Guardado persistente de campañas.
- Integración TTS / música generativa.
- Herramientas para GMs humanos que quieran usar la IA como asistente.

8. Ejemplos de formato de personaje (MVP)
-----------------------------------------
{
  "nombre":"Aún no definido",
  "raza":"Elfo",
  "clase":"Pícaro",
  "atributos":{"Agilidad":"Alta","Fuerza":"Baja","Carisma":"Media"},
  "habilidades":["Sigilo","Juego de Manos","Acrobacias"],
  "inventario":["Dos Dagas","Ropa de cuero oscura","Ganzúas"],
  "estado":"Saludable"
}

9. Resolución de acciones (esquema)
-----------------------------------
- Input: texto libre del jugador.
- Parseo: extraer intención / verbo / objetivo.
- Lookup: identificar habilidades y atributos relevantes.
- Determinar dificultad (contextual).
- Generar probabilidad base -> combinar modificadores.
- Tirada RNG (con semilla) -> mapear a éxito / parcial / fallo.
- Narración final + efectos de estado.

10. Ética y seguridad
---------------------
- Moderación de entradas (contenido sexual, violento extremo, discurso de odio).
- Control de generación de imágenes (evitar representaciones problemáticas).
- Privacidad: datos del usuario y guardado seguro de partidas.

11. Roadmap (resumido)
----------------------
- v1.0 (MVP single player) — núcleo descrito aquí.
- v1.5 (multijugador sala, turnos).
- v2.0 (sistemas de progresión, guardado, TTS, editor de campaña).
```