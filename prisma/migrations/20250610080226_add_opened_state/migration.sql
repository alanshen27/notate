-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Folder" ("createdAt", "id", "isDefault", "name", "parentId", "updatedAt", "userId") SELECT "createdAt", "id", "isDefault", "name", "parentId", "updatedAt", "userId" FROM "Folder";
DROP TABLE "Folder";
ALTER TABLE "new_Folder" RENAME TO "Folder";
CREATE INDEX "Folder_userId_idx" ON "Folder"("userId");
CREATE INDEX "Folder_parentId_idx" ON "Folder"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
