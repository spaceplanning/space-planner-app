CREATE TABLE `systemJobs` (
	`id` varchar(64) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`description` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemJobs_scheduleCronTaskUid_unique` UNIQUE(`scheduleCronTaskUid`)
);
