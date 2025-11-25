import { PrismaClient, ItemRarity, ItemType } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // 1. Create User
  const userId = randomUUID();
  const user = await prisma.user.create({
    data: {
      id: userId,
      email: "demo@rpg-ai.com",
      username: "DemoUser",
      password: "hashed_password_placeholder", // In real app, hash this
      displayName: "Demo Player",
      status: "ACTIVE"
    }
  });
  console.log("User created:", user.username);

  // 2. Create Item Templates
  const sword = await prisma.itemTemplate.create({
    data: {
      name: "Espada de Hierro",
      description: "Una espada simple pero confiable.",
      type: ItemType.WEAPON,
      rarity: ItemRarity.COMMON,
      baseValue: 10,
      weight: 2.5,
      stats: { attack: 5 },
      requirements: { level: 1 }
    }
  });

  const potion = await prisma.itemTemplate.create({
    data: {
      name: "Poción de Vida Menor",
      description: "Restaura 20 puntos de vida.",
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      baseValue: 5,
      stackable: true,
      weight: 0.5,
      effects: [{ type: "HEAL", value: 20 }]
    }
  });
  console.log("Items created");

  // 3. Create Enemy Templates
  await prisma.enemyTemplate.create({
    data: {
      name: "Goblin Explorador",
      description: "Un pequeño goblin con una daga oxidada.",
      level: 1,
      type: "Humanoid",
      health: 30,
      mana: 0,
      attack: 4,
      defense: 1,
      experience: 15,
      aiBehavior: { aggression: "high", fleeHealth: 5 }
    }
  });
  console.log("Enemies created");

  // 4. Create Quest Template
  await prisma.questTemplate.create({
    data: {
      title: "Limpieza de Ratas",
      description: "El tabernero necesita ayuda con unas ratas gigantes en el sótano.",
      minLevel: 1,
      objectives: [{ type: "KILL", target: "Giant Rat", count: 5 }],
      rewards: { xp: 50, gold: 10 }
    }
  });
  console.log("Quests created");

  // 5. Create Game Session
  const sessionId = randomUUID();
  const session = await prisma.gameSession.create({
    data: {
      id: sessionId,
      ownerId: user.id,
      title: "Demo Adventure",
      summary: "Una aventura de prueba.",
      seed: 12345,
      settings: { difficulty: "normal" }
    }
  });

  // 6. Create Character
  const character = await prisma.character.create({
    data: {
      id: randomUUID(),
      sessionId: session.id,
      playerId: user.id,
      nombre: "Elandra",
      raza: "Elfo",
      clase: "Pícaro",
      atributos: {
        nivel: 1,
        experiencia: 0,
        vida: { actual: 100, maxima: 100 },
        mana: { actual: 50, maxima: 50 },
        fuerza: 10,
        destreza: 16,
        inteligencia: 12
      },
      habilidades: ["Sigilo", "Apuñalar"],
      inventario: [], // Deprecated field, keeping empty
      estado: "active",
      seed: 12345
    }
  });

  // 7. Give Items to Character
  await prisma.inventoryItem.create({
    data: {
      characterId: character.id,
      itemTemplateId: sword.id,
      quantity: 1,
      isEquipped: true
    }
  });

  await prisma.inventoryItem.create({
    data: {
      characterId: character.id,
      itemTemplateId: potion.id,
      quantity: 3
    }
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
