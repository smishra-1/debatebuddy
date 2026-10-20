-- Students can now pick how many rounds a debate has (3, 5 or 7). Older debates keep 3.
alter table public.debates
  add column rounds int not null default 3 check (rounds in (3, 5, 7));
