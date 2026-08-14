CREATE TABLE `chat_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`messageId` int,
	`fileName` varchar(256) NOT NULL,
	`fileType` varchar(64) NOT NULL,
	`fileSize` int,
	`storageKey` varchar(512) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`provider` varchar(64) NOT NULL DEFAULT 'openai',
	`endpoint` varchar(512) NOT NULL,
	`apiKey` varchar(255),
	`modelName` varchar(128) NOT NULL,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_models_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` mediumtext,
	`toolType` varchar(32) NOT NULL DEFAULT 'webhook',
	`endpoint` varchar(512),
	`systemInstruction` mediumtext,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_tools_id` PRIMARY KEY(`id`)
);
