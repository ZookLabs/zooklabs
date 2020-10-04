alter table sprint add column disqualified bool not null default false;
alter table block_push add column disqualified bool not null default false;
alter table hurdles add column disqualified bool not null default false;
alter table high_jump add column disqualified bool not null default false;
alter table lap add column disqualified bool not null default false;