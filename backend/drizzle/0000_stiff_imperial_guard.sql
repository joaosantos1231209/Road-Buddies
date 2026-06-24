CREATE TABLE `chat_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`trip_id` int NOT NULL,
	`last_read_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_reads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_office` boolean NOT NULL DEFAULT false,
	CONSTRAINT `cities_id` PRIMARY KEY(`id`),
	CONSTRAINT `cities_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `company_vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`plate` varchar(10) NOT NULL,
	`office_id` int NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_vehicles_plate_unique` UNIQUE(`plate`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider_trip_id` int NOT NULL,
	`seeker_trip_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`is_read` boolean NOT NULL DEFAULT false,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`trip_id` int NOT NULL,
	`sender_id` varchar(128) NOT NULL,
	`content` text NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sp_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`origin_id` int,
	`destination_id` int NOT NULL,
	`date_needed` timestamp NOT NULL,
	`justification` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sp_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trip_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trip_id` int NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trip_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `trip_participants_unique_idx` UNIQUE(`trip_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `trip_subscriptions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`origin_id` int NOT NULL,
	`destination_id` int NOT NULL,
	`duration_type` varchar(20) NOT NULL,
	`expires_at` timestamp,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trip_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `trip_subscriptions_user_origin_dest_idx` UNIQUE(`user_id`,`origin_id`,`destination_id`)
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`type` varchar(20) NOT NULL,
	`origin_id` int NOT NULL,
	`destination_id` int NOT NULL,
	`departure_time` timestamp NOT NULL,
	`return_time` timestamp,
	`available_seats` int NOT NULL DEFAULT 0,
	`vehicle_type` text,
	`trip_vehicle_details` text,
	`company_vehicle_id` int,
	`hidden` boolean NOT NULL DEFAULT false,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(128) NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(255) NOT NULL,
	`avatar_url` text,
	`phone` varchar(20),
	`vehicle_info` text,
	`is_admin` boolean NOT NULL DEFAULT false,
	`is_verified` boolean NOT NULL DEFAULT false,
	`verification_code` varchar(10),
	`verification_expiry` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`fcm_token` text,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `chat_reads` ADD CONSTRAINT `chat_reads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_reads` ADD CONSTRAINT `chat_reads_trip_id_trips_id_fk` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_vehicles` ADD CONSTRAINT `company_vehicles_office_id_cities_id_fk` FOREIGN KEY (`office_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_provider_trip_id_trips_id_fk` FOREIGN KEY (`provider_trip_id`) REFERENCES `trips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_seeker_trip_id_trips_id_fk` FOREIGN KEY (`seeker_trip_id`) REFERENCES `trips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_trip_id_trips_id_fk` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sp_requests` ADD CONSTRAINT `sp_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sp_requests` ADD CONSTRAINT `sp_requests_origin_id_cities_id_fk` FOREIGN KEY (`origin_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sp_requests` ADD CONSTRAINT `sp_requests_destination_id_cities_id_fk` FOREIGN KEY (`destination_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trip_participants` ADD CONSTRAINT `trip_participants_trip_id_trips_id_fk` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trip_participants` ADD CONSTRAINT `trip_participants_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trip_subscriptions` ADD CONSTRAINT `trip_subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trip_subscriptions` ADD CONSTRAINT `trip_subscriptions_origin_id_cities_id_fk` FOREIGN KEY (`origin_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trip_subscriptions` ADD CONSTRAINT `trip_subscriptions_destination_id_cities_id_fk` FOREIGN KEY (`destination_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trips` ADD CONSTRAINT `trips_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trips` ADD CONSTRAINT `trips_origin_id_cities_id_fk` FOREIGN KEY (`origin_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trips` ADD CONSTRAINT `trips_destination_id_cities_id_fk` FOREIGN KEY (`destination_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trips` ADD CONSTRAINT `trips_company_vehicle_id_company_vehicles_id_fk` FOREIGN KEY (`company_vehicle_id`) REFERENCES `company_vehicles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `chat_reads_user_trip_idx` ON `chat_reads` (`user_id`,`trip_id`);--> statement-breakpoint
CREATE INDEX `matches_provider_trip_id_idx` ON `matches` (`provider_trip_id`);--> statement-breakpoint
CREATE INDEX `matches_seeker_trip_id_idx` ON `matches` (`seeker_trip_id`);--> statement-breakpoint
CREATE INDEX `messages_trip_id_idx` ON `messages` (`trip_id`);--> statement-breakpoint
CREATE INDEX `messages_created_at_idx` ON `messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `trip_participants_trip_id_idx` ON `trip_participants` (`trip_id`);--> statement-breakpoint
CREATE INDEX `trip_participants_user_id_idx` ON `trip_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `trip_subscriptions_active_idx` ON `trip_subscriptions` (`is_active`);--> statement-breakpoint
CREATE INDEX `trips_user_id_idx` ON `trips` (`user_id`);--> statement-breakpoint
CREATE INDEX `trips_status_idx` ON `trips` (`status`);--> statement-breakpoint
CREATE INDEX `trips_departure_time_idx` ON `trips` (`departure_time`);--> statement-breakpoint
CREATE INDEX `trips_origin_dest_idx` ON `trips` (`origin_id`,`destination_id`);