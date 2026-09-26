CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"visible_start_minute" integer DEFAULT 480 NOT NULL,
	"visible_end_minute" integer DEFAULT 1200 NOT NULL,
	"work_day_duration_minutes" integer DEFAULT 480 NOT NULL,
	CONSTRAINT "user_settings_window_check" CHECK ("user_settings"."visible_start_minute" >= 0 and "user_settings"."visible_start_minute" < "user_settings"."visible_end_minute" and "user_settings"."visible_end_minute" <= 1440 and "user_settings"."visible_start_minute" % 30 = 0 and "user_settings"."visible_end_minute" % 30 = 0),
	CONSTRAINT "user_settings_duration_check" CHECK ("user_settings"."work_day_duration_minutes" >= 30 and "user_settings"."work_day_duration_minutes" <= 1440 and "user_settings"."work_day_duration_minutes" % 30 = 0)
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;