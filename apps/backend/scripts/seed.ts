import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const sessionId = randomUUID();
  const playerId = randomUUID();

  const existing = await prisma.session.findFirst({
    where: { title: "Demo Seed" }
  });

  if (existing) {
    console.log("Seed data already exists. Skipping creation.");
    return;
  }

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      ownerId: playerId,
      title: "Demo Seed",
      summary: "Sesión inicial para pruebas de endpoints.",
      seed: Math.floor(Math.random() * 2 ** 32)
    }
  });

  const character = await prisma.character.create({
    data: {
      id: randomUUID(),
      sessionId: session.id,
      playerId,
      nombre: "Elandra Sombra",
      raza: "Elfo",
      clase: "Pícaro",
      atributos: {
        Fuerza: "Media",
        Agilidad: "Alta",
        Constitución: "Media",
        Inteligencia: "Alta",
        Sabiduría: "Media",
        Carisma: "Alta"
      },
      habilidades: ["Sigilo", "Juego de Manos", "Acrobacias"],
      inventario: ["Dos Dagas", "Ganzúas", "Capa Oscura"],
      estado: "Saludable",
      seed: Math.floor(Math.random() * 2 ** 32)
    }
  });

  console.log({ session, character });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
