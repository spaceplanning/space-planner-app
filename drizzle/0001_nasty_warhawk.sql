CREATE TABLE `floorPlanShares` (
	`id` varchar(64) NOT NULL,
	`floorPlanId` varchar(64) NOT NULL,
	`ownerId` int NOT NULL,
	`sharedWithUserId` int,
	`shareToken` varchar(64) NOT NULL,
	`permission` enum('view','edit') NOT NULL DEFAULT 'view',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `floorPlanShares_id` PRIMARY KEY(`id`),
	CONSTRAINT `floorPlanShares_shareToken_unique` UNIQUE(`shareToken`)
);
