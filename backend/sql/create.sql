drop database if exists voice;

create database voice;

use voice;

grant select, insert, update, delete on voice.* to 'kakit'@'localhost' identified by 'xxxxx';

create table users (
	`id` varchar(50) not null,
	`nickname` varchar(50) not null,
	`province` varchar(50),
	`city` varchar(50),
	`country` varchar(50),
	`gender` int,
	`avatar` varchar(200) not null,
	primary key (`id`)
) engine=innodb default charset=utf8;

create table voices (
	`id` varchar(50) not null,
	`userid` varchar(50) not null,
	`path` varchar(100) not null,
	`text` text not null,
	`created_at` real not null,
	`is_shared` int default 0,
	`n_comments` int default 0,
	`n_likes` int default 0,
	key (`created_at`),
	primary key (`id`) 
) engine=innodb default charset=utf8;

create table comments (
	`id` varchar(50) not null,
	`userid` varchar(50) not null,
	`voiceid` varchar(50) not null,
	`text` text not null,
	`created_at` real not null,
	key (`created_at`),
	primary key (`id`) 
) engine=innodb default charset=utf8;

create table likes (
	`userid` varchar(50) not null,
	`voiceid` varchar(50) not null,
	`created_at`  real not null,
	key (`created_at`),
	primary key (`userid`, `voiceid`) 
) engine=innodb default charset=utf8;


