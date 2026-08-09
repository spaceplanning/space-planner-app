CREATE TABLE `policyVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyType` enum('privacy','terms') NOT NULL,
	`version` varchar(32) NOT NULL,
	`content` text NOT NULL,
	`effectiveDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `policyVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(255),
	`profilePhotoUrl` text,
	`bio` text,
	`unitSystem` enum('feet','meters') NOT NULL DEFAULT 'feet',
	`theme` enum('dark','light','auto') NOT NULL DEFAULT 'dark',
	`notificationsEnabled` int NOT NULL DEFAULT 1,
	`onboardingCompleted` int NOT NULL DEFAULT 0,
	`privacyPolicyAccepted` int NOT NULL DEFAULT 0,
	`termsOfServiceAccepted` int NOT NULL DEFAULT 0,
	`privacyPolicyAcceptedAt` timestamp,
	`termsOfServiceAcceptedAt` timestamp,
	`analyticsEnabled` int NOT NULL DEFAULT 1,
	`crashReportingEnabled` int NOT NULL DEFAULT 1,
	`marketingEmailsEnabled` int NOT NULL DEFAULT 0,
	`platform` enum('web','ios','android') DEFAULT 'web',
	`appVersion` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `floorPlans` DROP COLUMN `perimeterJson`;