-- update users id to integer
alter table users alter column id type integer using id::integer;
alter table zook alter column owner type integer using owner::integer;

-- update zook id to integer
alter table zook alter column id type integer using id::integer;
alter table block_push alter column zookid type integer using zookid::integer;
alter table high_jump alter column zookid type integer using zookid::integer;
alter table hurdles alter column zookid type integer using zookid::integer;
alter table lap alter column zookid type integer using zookid::integer;
alter table sprint alter column zookid type integer using zookid::integer;

-- update trial name to not null
alter table block_push alter column name set not null;
alter table high_jump alter column name set not null;
alter table hurdles alter column name set not null;
alter table lap alter column name set not null;
alter table sprint alter column name set not null;
