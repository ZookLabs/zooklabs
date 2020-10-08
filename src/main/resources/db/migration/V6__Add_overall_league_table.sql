create table overall_league
(
    zookid   SMALLSERIAL      not null,
    name     VARCHAR(25)      not null,
    position INT              not null,
    score    DOUBLE PRECISION not null,
    constraint overall_league_pk
        primary key (zookid),
    constraint overall_league_zook_id_fk
        foreign key (zookid) references zook (id)
            on delete cascade
);
