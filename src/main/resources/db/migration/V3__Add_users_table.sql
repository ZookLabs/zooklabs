create table users
(
	id smallserial
		constraint user_pk
			primary key,
	username varchar,
	discord_id varchar not null,
	discord_username varchar not null,
	sign_up_at timestamp not null,
	last_login_at timestamp not null
);

create unique index user_discord_id_uindex
	on users (discord_id);

create unique index user_username_uindex
	on users (username);

alter table zook
	add owner smallint;

alter table zook
	add constraint zook_user_id_fk
		foreign key (owner) references users
			on update cascade on delete set null;
