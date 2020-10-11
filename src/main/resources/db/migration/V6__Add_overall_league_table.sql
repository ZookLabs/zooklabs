create table overall_league
(
    zookid       INTEGER          not null,
    name         VARCHAR(25)      not null,
    position     INT              not null,
    score        DOUBLE PRECISION not null,
    disqualified BOOL             not null default false,
    constraint overall_league_pk
        primary key (zookid),
    constraint overall_league_zook_id_fk
        foreign key (zookid) references zook (id)
            on delete cascade
);
ALTER TABLE leagues_metadata
    ALTER COLUMN league type varchar(15) using league::varchar(15);
INSERT INTO leagues_metadata (league, updated_at)
VALUES ('overall_league', '1970-01-01 00:00:00.000000');