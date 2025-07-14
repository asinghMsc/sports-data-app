create table "public"."articles" (
    "id" uuid not null default gen_random_uuid(),
    "source_id" uuid not null,
    "title" text,
    "link" text,
    "published_at" timestamp with time zone,
    "content" text,
    "category" text,
    "sentiment" text,
    "teams_mentioned" jsonb default '[]'::jsonb,
    "is_flagged" boolean default false
);


alter table "public"."articles" enable row level security;

create table "public"."sources" (
    "id" uuid not null default gen_random_uuid(),
    "url" text not null,
    "name" text,
    "last_crawled_at" timestamp with time zone default now()
);


alter table "public"."sources" enable row level security;

create table "public"."profiles" (
    "id" uuid not null references auth.users on delete cascade,
    "email" text,
    primary key (id)
);

alter table "public"."profiles" enable row level security;

CREATE UNIQUE INDEX articles_link_key ON public.articles USING btree (link);

CREATE UNIQUE INDEX articles_pkey ON public.articles USING btree (id);

CREATE UNIQUE INDEX sources_pkey ON public.sources USING btree (id);

CREATE UNIQUE INDEX sources_url_key ON public.sources USING btree (url);

alter table "public"."articles" add constraint "articles_pkey" PRIMARY KEY using index "articles_pkey";

alter table "public"."sources" add constraint "sources_pkey" PRIMARY KEY using index "sources_pkey";

alter table "public"."articles" add constraint "articles_link_key" UNIQUE using index "articles_link_key";

alter table "public"."articles" add constraint "articles_source_id_fkey" FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE not valid;

alter table "public"."articles" validate constraint "articles_source_id_fkey";

alter table "public"."sources" add constraint "sources_url_key" UNIQUE using index "sources_url_key";


create policy "Authenticated users can view articles from their sources."
on "public"."articles" for select
using ( exists (select 1 from sources where sources.id = articles.source_id and sources.user_id = auth.uid()) );

create policy "Authenticated users can manage their own sources."
on "public"."sources" for all
using ( auth.uid() = user_id );

create policy "Users can view own profile."
on "public"."profiles" for select
using ( auth.uid() = id );

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

grant delete on table "public"."articles" to "anon";

grant insert on table "public"."articles" to "anon";

grant references on table "public"."articles" to "anon";

grant select on table "public"."articles" to "anon";

grant trigger on table "public"."articles" to "anon";

grant truncate on table "public"."articles" to "anon";

grant update on table "public"."articles" to "anon";

grant delete on table "public"."articles" to "authenticated";

grant insert on table "public"."articles" to "authenticated";

grant references on table "public"."articles" to "authenticated";

grant select on table "public"."articles" to "authenticated";

grant trigger on table "public"."articles" to "authenticated";

grant truncate on table "public"."articles" to "authenticated";

grant update on table "public"."articles" to "authenticated";

grant delete on table "public"."articles" to "service_role";

grant insert on table "public"."articles" to "service_role";

grant references on table "public"."articles" to "service_role";

grant select on table "public"."articles" to "service_role";

grant trigger on table "public"."articles" to "service_role";

grant truncate on table "public"."articles" to "service_role";

grant update on table "public"."articles" to "service_role";

grant delete on table "public"."sources" to "anon";

grant insert on table "public"."sources" to "anon";

grant references on table "public"."sources" to "anon";

grant select on table "public"."sources" to "anon";

grant trigger on table "public"."sources" to "anon";

grant truncate on table "public"."sources" to "anon";

grant update on table "public"."sources" to "anon";

grant delete on table "public"."sources" to "authenticated";

grant insert on table "public"."sources" to "authenticated";

grant references on table "public"."sources" to "authenticated";

grant select on table "public"."sources" to "authenticated";

grant trigger on table "public"."sources" to "authenticated";

grant truncate on table "public"."sources" to "authenticated";

grant update on table "public"."sources" to "authenticated";

grant delete on table "public"."sources" to "service_role";

grant insert on table "public"."sources" to "service_role";

grant references on table "public"."sources" to "service_role";

grant select on table "public"."sources" to "service_role";

grant trigger on table "public"."sources" to "service_role";

grant truncate on table "public"."sources" to "service_role";

grant update on table "public"."sources" to "service_role";


