import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== ACCOUNTS ===");
  const accounts = await prisma.account.findMany();
  for (const acc of accounts) {
    console.log(`ID: ${acc.id} | Code: ${acc.code} | Name: ${acc.name} | Type: ${acc.type} | Balance: ${acc.balance}`);
  }

  console.log("\n=== TRANSACTIONS ===");
  const transactions = await prisma.transaction.findMany({
    include: {
      account: true,
      toAccount: true,
    }
  });
  for (const tx of transactions) {
    console.log(`ID: ${tx.id} | Date: ${tx.date.toISOString()} | Type: ${tx.type} | Amount: ${tx.amount} | Account: ${tx.account.name} (${tx.account.type}) | ToAccount: ${tx.toAccount?.name || "N/A"} | Category: ${tx.category} | Desc: ${tx.description}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
