create table tournament
(
	id integer
		constraint tournament_pk
			primary key,
	title varchar not null,
	description varchar not null,
	owner_id integer
		constraint tournament_users_id_fk
			references users,
	zooks jsonb not null
);

