CREATE TABLE `analyticsEvents` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`eventName` varchar(255) NOT NULL,
	`eventData` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `deletionRequestedAt` timestamp;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `deletionScheduledFor` timestamp;