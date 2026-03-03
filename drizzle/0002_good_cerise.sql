ALTER TABLE `bookings` ADD `stripeSessionId` varchar(256);--> statement-breakpoint
ALTER TABLE `bookings` ADD `stripePaymentIntentId` varchar(256);--> statement-breakpoint
ALTER TABLE `bookings` ADD `paymentStatus` enum('free','pending','paid','failed','refunded') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `priceCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `callTypes` ADD `isPaid` boolean DEFAULT false NOT NULL;