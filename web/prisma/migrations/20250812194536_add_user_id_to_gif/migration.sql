-- AlterTable
ALTER TABLE "public"."gifs" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."gifs" ADD CONSTRAINT "gifs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
