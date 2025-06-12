-- DropIndex
DROP INDEX "Folder_userId_isDefault_key";

-- CreateIndex
CREATE INDEX "Folder_userId_idx" ON "Folder"("userId");

-- CreateIndex
CREATE INDEX "Folder_parentId_idx" ON "Folder"("parentId");
