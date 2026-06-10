-- CreateIndex
CREATE INDEX "Proposal_userId_updatedAt_idx" ON "Proposal"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ProposalVersion_proposalId_idx" ON "ProposalVersion"("proposalId");
