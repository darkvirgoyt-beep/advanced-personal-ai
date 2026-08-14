CREATE TABLE `github_oauth` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`githubId` varchar(64),
	`githubLogin` varchar(128),
	`accessToken` text,
	`refreshToken` text,
	`scope` varchar(255),
	`state` varchar(64) NOT NULL,
	`stateExpiry` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `github_oauth_id` PRIMARY KEY(`id`),
	CONSTRAINT `github_oauth_state_unique` UNIQUE(`state`)
);
