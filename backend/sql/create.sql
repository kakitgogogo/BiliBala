drop database if exists voice;

create database voice;

use voice;

grant select, insert, update, delete on voice.* to 'kakit'@'localhost' identified by '131413';

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
	`created_at` real not null,
	key `idx_created_at` (`created_at`),
	primary key (`id`) 
) engine=innodb default charset=utf8;

