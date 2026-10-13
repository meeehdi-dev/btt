CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'mid', 'high');--> statement-breakpoint
ALTER TABLE "ticket" ADD COLUMN "priority" "ticket_priority";