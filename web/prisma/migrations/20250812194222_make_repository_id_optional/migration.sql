-- DropForeignKey
ALTER TABLE "public"."gifs" DROP CONSTRAINT "gifs_repositoryId_fkey";

-- AlterTable
ALTER TABLE "public"."gifs" ALTER COLUMN "repositoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."gifs" ADD CONSTRAINT "gifs_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
