import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.qubartechTeamMember.updateMany({
    where: {
      name: "Tahir Ahmad",
    },
    data: {
      image: "/image/our_teams/tahir.jpg",
    },
  });
  console.log("Reset Tahir Ahmad image path count:", result.count);
}

main().finally(() => prisma.$disconnect());
