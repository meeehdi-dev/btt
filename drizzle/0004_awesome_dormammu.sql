CREATE TABLE "ticket" (
	"id" uuid PRIMARY KEY NOT NULL,
	"release_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'Idea' NOT NULL,
	"estimate_minutes" integer,
	"archived_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "ticket_status_check" CHECK ("ticket"."status" in ('Idea', 'Estimate', 'Develop', 'Review', 'Test', 'Deploy', 'Done')),
	CONSTRAINT "ticket_estimate_positive_check" CHECK ("ticket"."estimate_minutes" is null or "ticket"."estimate_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "ticket_link" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ticket_id" uuid NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_relation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"from_ticket_id" uuid NOT NULL,
	"to_ticket_id" uuid NOT NULL,
	CONSTRAINT "ticket_relation_order_check" CHECK ("ticket_relation"."from_ticket_id" < "ticket_relation"."to_ticket_id")
);
--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_release_id_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."release"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_link" ADD CONSTRAINT "ticket_link_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_relation" ADD CONSTRAINT "ticket_relation_from_ticket_id_ticket_id_fk" FOREIGN KEY ("from_ticket_id") REFERENCES "public"."ticket"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_relation" ADD CONSTRAINT "ticket_relation_to_ticket_id_ticket_id_fk" FOREIGN KEY ("to_ticket_id") REFERENCES "public"."ticket"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ticket_release_id_idx" ON "ticket" USING btree ("release_id");--> statement-breakpoint
CREATE INDEX "ticket_link_ticket_id_idx" ON "ticket_link" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_relation_pair_idx" ON "ticket_relation" USING btree ("from_ticket_id","to_ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_relation_to_idx" ON "ticket_relation" USING btree ("to_ticket_id");