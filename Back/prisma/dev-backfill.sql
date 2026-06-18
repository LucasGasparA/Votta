DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Municipality'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Municipality'
      AND column_name = 'ibgeId'
  ) THEN
    ALTER TABLE "Municipality" ADD COLUMN "ibgeId" TEXT;

    UPDATE "Municipality"
    SET "ibgeId" = CASE
      WHEN "name" = 'Nova Veneza' AND "state" = 'SC' THEN '4211603'
      ELSE "id"
    END
    WHERE "ibgeId" IS NULL;

    ALTER TABLE "Municipality" ALTER COLUMN "ibgeId" SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Municipality'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Municipality'
      AND column_name = 'ibgeId'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Municipality_ibgeId_key'
  ) THEN
    CREATE UNIQUE INDEX "Municipality_ibgeId_key" ON "Municipality"("ibgeId");
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ProposalVersion'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'ProposalVersion_proposalId_versionNumber_key'
  ) THEN
    CREATE UNIQUE INDEX "ProposalVersion_proposalId_versionNumber_key"
      ON "ProposalVersion"("proposalId", "versionNumber");
  END IF;
END $$;
