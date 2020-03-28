create table leagues_metadata
(
    league     varchar(10) not null,
    updated_at timestamp   not null,
    constraint league_metadata_pk
        primary key (league)
);

create unique index leagues_metadata_league_uindex
    on leagues_metadata (league);

INSERT INTO leagues_metadata (league, updated_at)
VALUES ('sprint', '1970-01-01 00:00:00.000000'),
       ('block_push', '1970-01-01 00:00:00.000000'),
       ('hurdles', '1970-01-01 00:00:00.000000'),
       ('high_jump', '1970-01-01 00:00:00.000000'),
       ('lap', '1970-01-01 00:00:00.000000');
