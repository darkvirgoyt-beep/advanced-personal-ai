CREATE TABLE `dev_project_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`path` varchar(512) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`size` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dev_project_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dev_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` varchar(512),
	`githubRepoFullName` varchar(256),
	`runCommand` varchar(512) NOT NULL DEFAULT 'npm run dev',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dev_projects_id` PRIMARY KEY(`id`)
);
