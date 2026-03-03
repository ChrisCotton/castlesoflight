CREATE TABLE `newsletterIssues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(512) NOT NULL,
	`previewText` varchar(512),
	`htmlBody` text NOT NULL,
	`textBody` text,
	`status` enum('draft','sent','scheduled') NOT NULL DEFAULT 'draft',
	`recipientCount` int NOT NULL DEFAULT 0,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterIssues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterSubscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(128),
	`lastName` varchar(128),
	`status` enum('active','unsubscribed','bounced') NOT NULL DEFAULT 'active',
	`source` enum('landing_page','book_download','booking','contact_form','manual','other') NOT NULL DEFAULT 'landing_page',
	`tags` json DEFAULT ('[]'),
	`unsubscribeToken` varchar(128) NOT NULL,
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`unsubscribedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterSubscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletterSubscribers_email_unique` UNIQUE(`email`)
);
