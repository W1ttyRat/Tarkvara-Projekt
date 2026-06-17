-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.client (
    id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    name character varying NOT NULL,
    email character varying,
    phone character varying,
    CONSTRAINT client_pkey PRIMARY KEY (id)
);

CREATE TABLE public.licence_category (
    id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    code character varying NOT NULL UNIQUE,
    name character varying NOT NULL,
    CONSTRAINT licence_category_pkey PRIMARY KEY (id)
);

CREATE TABLE public.vehicle (
    id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    client_id integer NOT NULL,
    licence_category_id integer NOT NULL,
    registration_number character varying NOT NULL UNIQUE,
    vin character varying,
    make character varying,
    model character varying,
    width_mm integer CHECK (
        width_mm IS NULL
        OR width_mm > 0
    ),
    height_mm integer CHECK (
        height_mm IS NULL
        OR height_mm > 0
    ),
    length_mm integer CHECK (
        length_mm IS NULL
        OR length_mm > 0
    ),
    CONSTRAINT vehicle_pkey PRIMARY KEY (id),
    CONSTRAINT fk_vehicle_client FOREIGN KEY (client_id) REFERENCES public.client (id),
    CONSTRAINT fk_vehicle_licence_category FOREIGN KEY (licence_category_id) REFERENCES public.licence_category (id)
);

CREATE TABLE public.worker (
    id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    name character varying NOT NULL,
    email character varying,
    phone character varying,
    user_id integer UNIQUE,
    CONSTRAINT worker_pkey PRIMARY KEY (id),
    CONSTRAINT fk_worker_user FOREIGN KEY (user_id) REFERENCES public.users (id)
);

CREATE TABLE public.worker_licence_category (
    worker_id integer NOT NULL,
    licence_category_id integer NOT NULL,
    id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    CONSTRAINT worker_licence_category_pkey PRIMARY KEY (id),
    CONSTRAINT fk_worker_category_worker FOREIGN KEY (worker_id) REFERENCES public.worker (id),
    CONSTRAINT fk_worker_category_licence_category FOREIGN KEY (licence_category_id) REFERENCES public.licence_category (id)
);

CREATE TABLE public.location (
    id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    city character varying NOT NULL,
    address character varying,
    door_width_mm integer NOT NULL CHECK (door_width_mm > 0),
    door_height_mm integer NOT NULL CHECK (door_height_mm > 0),
    CONSTRAINT location_pkey PRIMARY KEY (id)
);

CREATE TABLE public.worker_shift (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  worker_id integer NOT NULL,
  location_id integer NOT NULL,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  CONSTRAINT worker_shift_pkey PRIMARY KEY (id),
  CONSTRAINT fk_worker_shift_worker FOREIGN KEY (worker_id) REFERENCES public.worker(id),
  CONSTRAINT fk_worker_shift_location FOREIGN KEY (location_id) REFERENCES public.location(id)
);

CREATE TABLE public.service (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  required_licence_category_id integer NOT NULL,
  name character varying NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  price numeric CHECK (price IS NULL OR price >= 0::numeric),
  CONSTRAINT service_pkey PRIMARY KEY (id),
  CONSTRAINT fk_service_required_licence_category FOREIGN KEY (required_licence_category_id) REFERENCES public.licence_category(id)
);

CREATE TABLE public.reservation (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  client_id integer NOT NULL,
  vehicle_id integer NOT NULL,
  location_id integer NOT NULL,
  service_id integer NOT NULL,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'completed'::character varying]::text[])),
  comment text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reservation_pkey PRIMARY KEY (id),
  CONSTRAINT fk_reservation_client FOREIGN KEY (client_id) REFERENCES public.client(id),
  CONSTRAINT fk_reservation_vehicle FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(id),
  CONSTRAINT fk_reservation_location FOREIGN KEY (location_id) REFERENCES public.location(id),
  CONSTRAINT fk_reservation_service FOREIGN KEY (service_id) REFERENCES public.service(id)
);

CREATE TABLE public.unavailable_time (
    id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    worker_id integer NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    reason text,
    CONSTRAINT unavailable_time_pkey PRIMARY KEY (id),
    CONSTRAINT fk_unavailable_time_worker FOREIGN KEY (worker_id) REFERENCES public.worker (id)
);

CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  username character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role character varying NOT NULL DEFAULT 'employee'::character varying CHECK (role::text = ANY (ARRAY['employee'::character varying, 'boss'::character varying]::text[])),
  session_version integer NOT NULL DEFAULT 0,
  failed_attempts integer DEFAULT 0,
  locked_until timestamp with time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  must_change_password boolean NOT NULL DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE public.refresh_tokens (
  id bigint NOT NULL DEFAULT nextval('refresh_tokens_id_seq'::regclass),
  user_id integer NOT NULL,
  jti uuid NOT NULL UNIQUE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  replaced_by_jti uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_used_at timestamp with time zone,
  CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.rate_limits (
    key text NOT NULL,
    hits integer NOT NULL,
    reset_at timestamp
    with
        time zone NOT NULL,
        CONSTRAINT rate_limits_pkey PRIMARY KEY (key)
);