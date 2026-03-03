CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`category` enum('first_touch','follow_up','proposal','closed_won','re_engagement','custom') NOT NULL DEFAULT 'custom',
	`subject` varchar(512) NOT NULL,
	`bodyHtml` text NOT NULL,
	`variables` json DEFAULT ('[]'),
	`isBuiltIn` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
