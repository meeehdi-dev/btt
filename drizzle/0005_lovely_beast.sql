CREATE TYPE "public"."ticket_status" AS ENUM('Idea', 'Estimate', 'Develop', 'Review', 'Test', 'Deploy', 'Done');--> statement-breakpoint
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_status_check";--> statement-breakpoint
ALTER TABLE "ticket" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ticket" ALTER COLUMN "status" SET DATA TYPE "public"."ticket_status" USING "status"::"public"."ticket_status";--> statement-breakpoint
ALTER TABLE "ticket" ALTER COLUMN "status" SET DEFAULT 'Idea'::"public"."ticket_status";
