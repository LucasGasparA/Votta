ALTER TABLE "Municipality" ADD COLUMN "ibgeId" TEXT;

UPDATE "Municipality"
SET "ibgeId" = CASE
  WHEN "name" = 'Nova Veneza' AND "state" = 'SC' THEN '4211603'
  ELSE "id"
END
WHERE "ibgeId" IS NULL;

ALTER TABLE "Municipality" ALTER COLUMN "ibgeId" SET NOT NULL;

CREATE UNIQUE INDEX "Municipality_ibgeId_key" ON "Municipality"("ibgeId");
CREATE UNIQUE INDEX "ProposalVersion_proposalId_versionNumber_key" ON "ProposalVersion"("proposalId", "versionNumber");
