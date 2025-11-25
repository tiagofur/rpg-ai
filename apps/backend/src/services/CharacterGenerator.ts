import { CharacterSheet, createSeededRng } from "../shared/index.js";

const RACES = ["Humano", "Elfo", "Enano", "Mediano", "Tiefling", "Dracónido"] as const;
const CLASSES = ["Guerrero", "Mago", "Pícaro", "Bardo", "Explorador", "Clérigo"] as const;
const ATTRIBUTE_KEYS = [
  "Fuerza",
  "Agilidad",
  "Constitución",
  "Inteligencia",
  "Sabiduría",
  "Carisma"
] as const;
const ATTRIBUTE_LEVELS = ["Alta", "Media", "Baja"] as const;

const CLASS_SKILLS: Record<string, ReadonlyArray<string>> = {
  Guerrero: ["Ataque Poderoso", "Intimidación", "Armas Marciales", "Atletismo"],
  Mago: ["Arcanos", "Conocimiento Histórico", "Trucos", "Concentración"],
  Pícaro: ["Sigilo", "Juego de Manos", "Percepción", "Acrobacias"],
  Bardo: ["Interpretación", "Persuasión", "Historia", "Juego de Manos"],
  Explorador: ["Supervivencia", "Sigilo", "Percepción", "Atletismo"],
  Clérigo: ["Religión", "Sanación", "Arcanos", "Persuasión"]
};

const CLASS_ITEMS: Record<string, ReadonlyArray<string>> = {
  Guerrero: ["Espada Bastarda", "Escudo Reforzado", "Cota de Malla", "Ración de Viaje"],
  Mago: ["Bastón Arcano", "Grimorio", "Componentes Arcanos", "Capa con Runas"],
  Pícaro: ["Dos Dagas", "Ganzúas", "Capa Oscura", "Frascos de Tinta"],
  Bardo: ["Laúd Tallado", "Capa Elegante", "Diario de Canciones", "Bolsa de Monedas"],
  Explorador: ["Arco Corto", "Carcaj con Flechas", "Capa de Camuflaje", "Kit de Explorador"],
  Clérigo: ["Maza Liviana", "Símbolo Sagrado", "Kit de Sanación", "Cota de Escamas"]
};

function pickFrom<T>(items: ReadonlyArray<T>, next: () => number): T {
  if (items.length === 0) throw new Error("Cannot pick from empty array");
  const index = Math.floor(next() * items.length) % items.length;
  return items[index] as T;
}

function pickUnique<T>(items: ReadonlyArray<T>, count: number, next: () => number): Array<T> {
  const available = [...items];
  const result: Array<T> = [];

  while (result.length < count && available.length > 0) {
    const index = Math.floor(next() * available.length) % available.length;
    const [value] = available.splice(index, 1);
    if (value !== undefined) result.push(value);
  }

  return result;
}

function deriveNameFromPrompt(prompt: string, next: () => number) {
  const sanitized = prompt
    .split(/[^\sA-Za-zÁÉÍÑÓÚáéíñóú]+/)
    .join(" ")
    .trim();

  if (!sanitized) {
    return `Aventurero ${Math.floor(next() * 900 + 100)}`;
  }

  const tokens = sanitized.split(/\s+/).filter(Boolean);
  const first = tokens[0] ?? "Aventurero";
  const second = tokens[1] ?? "Errante";

  return `${capitalize(first)} ${capitalize(second)}`;
}

function capitalize(value: string) {
  if (!value) return value;
  const [first, ...rest] = value.toLowerCase();
  if (!first) return value;
  return `${first.toUpperCase()}${rest.join("")}`;
}

export function generateCharacterSheet(prompt: string, seed: number): CharacterSheet {
  const rng = createSeededRng(seed);
  const nombre = deriveNameFromPrompt(prompt, rng);
  const clase = pickFrom(CLASSES, rng);
  const raza = pickFrom(RACES, rng);

  const atributos: Record<string, (typeof ATTRIBUTE_LEVELS)[number]> = {};
  for (const key of ATTRIBUTE_KEYS) {
    atributos[key] = pickFrom(ATTRIBUTE_LEVELS, rng);
  }

  const habilidades = pickUnique(CLASS_SKILLS[clase] ?? [], 3, rng);
  const inventario = pickUnique(CLASS_ITEMS[clase] ?? [], 3, rng);

  return {
    nombre,
    raza,
    clase,
    atributos,
    habilidades,
    inventario,
    estado: "Saludable"
  };
}
