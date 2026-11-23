ALTER TABLE "ticket_relation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "ticket_relation" CASCADE;--> statement-breakpoint
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_estimate_positive_check";--> statement-breakpoint
ALTER TABLE "ticket" DROP COLUMN "estimate_minutes";