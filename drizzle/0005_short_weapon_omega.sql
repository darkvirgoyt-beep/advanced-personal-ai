ALTER TABLE `settings` ADD `aiMode` varchar(32) DEFAULT 'fast' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `memoryEnabled` boolean DEFAULT true NOT NULL;