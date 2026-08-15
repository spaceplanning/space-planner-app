CREATE TABLE `crashReports` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`stack` text,
	`componentStack` text,
	`pageUrl` varchar(2048),
	`userAgent` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crashReports_id` PRIMARY KEY(`id`)
);
