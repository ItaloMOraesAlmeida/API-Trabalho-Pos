-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
