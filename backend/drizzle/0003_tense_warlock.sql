CREATE TABLE "company_vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"plate" varchar(10) NOT NULL,
	"office_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_vehicles_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "verification_expiry" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "company_vehicle_id" integer;--> statement-breakpoint
ALTER TABLE "company_vehicles" ADD CONSTRAINT "company_vehicles_office_id_cities_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_company_vehicle_id_company_vehicles_id_fk" FOREIGN KEY ("company_vehicle_id") REFERENCES "public"."company_vehicles"("id") ON DELETE no action ON UPDATE no action;