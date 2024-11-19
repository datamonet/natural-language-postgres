-- CreateTable
CREATE TABLE "unicorns" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "valuation" DOUBLE PRECISION NOT NULL,
    "date_joined" TIMESTAMP(3),
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "select_investors" TEXT NOT NULL,

    CONSTRAINT "unicorns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unicorns_company_key" ON "unicorns"("company");
