CREATE TABLE "chat_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"trip_id" integer NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sp_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"origin_id" integer,
	"destination_id" integer NOT NULL,
	"date_needed" timestamp with time zone NOT NULL,
	"justification" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_receiver_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "is_office" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "is_read" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "vehicle_type" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "trip_vehicle_details" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_code" varchar(10);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "fcm_token" text;--> statement-breakpoint
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sp_requests" ADD CONSTRAINT "sp_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sp_requests" ADD CONSTRAINT "sp_requests_origin_id_cities_id_fk" FOREIGN KEY ("origin_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sp_requests" ADD CONSTRAINT "sp_requests_destination_id_cities_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_reads_user_trip_idx" ON "chat_reads" USING btree ("user_id","trip_id");--> statement-breakpoint
CREATE INDEX "matches_provider_trip_id_idx" ON "matches" USING btree ("provider_trip_id");--> statement-breakpoint
CREATE INDEX "matches_seeker_trip_id_idx" ON "matches" USING btree ("seeker_trip_id");--> statement-breakpoint
CREATE INDEX "messages_trip_id_idx" ON "messages" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "trip_participants_trip_id_idx" ON "trip_participants" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_participants_user_id_idx" ON "trip_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trips_user_id_idx" ON "trips" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trips_status_idx" ON "trips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trips_departure_time_idx" ON "trips" USING btree ("departure_time");--> statement-breakpoint
CREATE INDEX "trips_origin_dest_idx" ON "trips" USING btree ("origin_id","destination_id");--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "receiver_id";