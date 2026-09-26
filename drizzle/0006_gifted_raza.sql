CREATE TABLE "time_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ticket_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_minute" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "time_entry_start_check" CHECK ("time_entry"."start_minute" >= 0 and "time_entry"."start_minute" < 1440 and "time_entry"."start_minute" % 30 = 0),
	CONSTRAINT "time_entry_duration_check" CHECK ("time_entry"."duration_minutes" >= 30 and "time_entry"."duration_minutes" % 30 = 0 and "time_entry"."start_minute" + "time_entry"."duration_minutes" <= 1440)
);
--> statement-breakpoint
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_ticket_id_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "time_entry_ticket_date_idx" ON "time_entry" USING btree ("ticket_id","date");--> statement-breakpoint
CREATE INDEX "time_entry_date_idx" ON "time_entry" USING btree ("date");