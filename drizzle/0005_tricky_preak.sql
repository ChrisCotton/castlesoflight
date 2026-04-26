CREATE TABLE `blogPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`slug` varchar(512) NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`targetLeadId` int,
	`status` enum('draft','published','private') NOT NULL DEFAULT 'draft',
	`viewCount` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blogPosts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blogPosts_slug_unique` UNIQUE(`slug`)
);
