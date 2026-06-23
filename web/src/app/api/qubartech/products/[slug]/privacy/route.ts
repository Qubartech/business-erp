import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";

export const GET = apiHandler(
  async (req, { params }) => {
    const { slug } = params;
    const product = await prisma.qubartechProduct.findFirst({
      where: {
        slug: slug.toLowerCase().trim(),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        privacyPolicy: true,
      },
    });

    if (!product) {
      throw NotFound("Product not found or inactive");
    }

    return product;
  },
  {
    requireAuth: false,
  }
);
