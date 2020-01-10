create table zook
(
    id           SMALLSERIAL,
    name         VARCHAR(25)      not null,
    height       DOUBLE PRECISION not null,
    length       DOUBLE PRECISION not null,
    width        DOUBLE PRECISION not null,
    weight       DOUBLE PRECISION not null,
    components   INT              not null,
    dateCreated  TIMESTAMP        not null,
    dateUploaded TIMESTAMP        not null,
    constraint zook_pk
        primary key (id)
);

create table sprint
(
    zookid   SMALLSERIAL      not null,
    name     VARCHAR(25)      null,
    position INT              not null,
    score    DOUBLE PRECISION not null,
    constraint sprint_zook_id_fk
        foreign key (zookid) references zook (id)
            on delete cascade
);

create table block_push
(
    zookid   SMALLSERIAL      not null,
    name     VARCHAR(25)      null,
    position INT              not null,
    score    DOUBLE PRECISION not null,
    constraint blockpush_zook_id_fk
        foreign key (zookid) references zook (id)
            on delete cascade
);

create table hurdles
(
    zookid   SMALLSERIAL      not null,
    name     VARCHAR(25)      null,
    position INT              not null,
    score    DOUBLE PRECISION not null,
    constraint hurdles_zook_id_fk
        foreign key (zookid) references zook (id)
            on delete cascade
);

create table high_jump
(
    zookid   SMALLSERIAL      not null,
    name     VARCHAR(25)      null,
    position INT              not null,
    score    DOUBLE PRECISION not null,
    constraint highjump_zook_id_fk
        foreign key (zookid) references zook (id)
            on delete cascade
);

create table lap
(
    zookid   SMALLSERIAL      not null,
    name     VARCHAR(25)      null,
    position INT              not null,
    score    DOUBLE PRECISION not null,
    constraint lap_zook_id_fk
        foreign key (zookid) references zook (id)
            on delete cascade
);