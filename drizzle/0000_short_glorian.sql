CREATE TABLE `lead_rate_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`fingerprint` text NOT NULL,
	`kind` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`state` text NOT NULL,
	`contact_preference` text NOT NULL,
	`fields_json` text NOT NULL,
	`consent` integer NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`provider_message_id` text,
	`last_error` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_idempotency_unique` ON `leads` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `leads_created_at_index` ON `leads` (`created_at`);--> statement-breakpoint
CREATE INDEX `leads_status_index` ON `leads` (`status`);