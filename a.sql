CREATE SCHEMA IF NOT EXISTS "public";

---------------------------------------------------
---                   people                    ---
---------------------------------------------------
CREATE TABLE "public".people ( 
    person_id             integer GENERATED ALWAYS AS IDENTITY,
    name                  varchar(50)  NOT NULL,
    first_name            varchar(50)  NOT NULL,
    pseudo                varchar(50),
    email                 varchar(100) NOT NULL,
    location              varchar(255) NOT NULL,
    cellphone_number      varchar(20)  NOT NULL,
    status                varchar(20)  DEFAULT 'candidate' NOT NULL,
    role                  varchar(20)  DEFAULT 'candidate' NOT NULL,
    password_hash         varchar(255),
    google_id             varchar(255),
    two_factor_secret     varchar(100),
    is_two_factor_enabled boolean DEFAULT FALSE NOT NULL,
    CONSTRAINT unq_store_people_email UNIQUE ( email ),
    CONSTRAINT unq_store_people_google_id UNIQUE ( google_id ),
    CONSTRAINT pk_store_people PRIMARY KEY ( person_id ),
    CONSTRAINT chk_role CHECK ( role IN ('candidate', 'recruiter', 'meeter', 'admin') )
);

---------------------------------------------------
---                   company                   ---
---------------------------------------------------
CREATE TABLE "public".company ( 
    id_company            integer GENERATED ALWAYS AS IDENTITY,
    person_id             integer NOT NULL,
    name                  varchar(100) NOT NULL,
    description           text,
    CONSTRAINT pk_companies PRIMARY KEY ( id_company )
);

---------------------------------------------------
---                advertisements               ---
---------------------------------------------------
CREATE TABLE "public".advertisements ( 
    advertisement_id      integer GENERATED ALWAYS AS IDENTITY,
    company_id            integer NOT NULL,
    title                 varchar(150) NOT NULL,
    location              varchar(255),
    description           text NOT NULL,
    contract_type         varchar(30),
    remote_status         varchar(30),
    category              varchar(50),
    created_at            timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_advertisements PRIMARY KEY ( advertisement_id )
);

---------------------------------------------------
---                 applications                ---
---------------------------------------------------
CREATE TABLE "public".applications ( 
    application_id        integer GENERATED ALWAYS AS IDENTITY,
    person_id             integer NOT NULL,
    advertisement_id      integer NOT NULL,
    message               text,
    resume_url            varchar(255),
    applied_at            timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_applications PRIMARY KEY ( application_id ),
    CONSTRAINT unq_application UNIQUE ( person_id, advertisement_id ) 
);

---------------------------------------------------
---                    events                   ---
---------------------------------------------------
CREATE TABLE "public".events ( 
    event_id              integer GENERATED ALWAYS AS IDENTITY,
    title                 varchar(150) NOT NULL,
    description           text NOT NULL,
    event_date            timestamp NOT NULL,
    location              varchar(150) NOT NULL,
    company_id            integer,
    organizer_id          integer NOT NULL,
    end_register_at       timestamp,
    CONSTRAINT pk_events PRIMARY KEY ( event_id )
);

---------------------------------------------------
---              event_participants             ---
---------------------------------------------------
CREATE TABLE "public".event_participants ( 
    event_id              integer NOT NULL,
    person_id             integer NOT NULL,
    registered_at         timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_event_participants PRIMARY KEY ( event_id, person_id )
);

---------------------------------------------------
---                   messages                  ---
---------------------------------------------------
CREATE TABLE "public".messages ( 
    message_id            bigint GENERATED ALWAYS AS IDENTITY,
    sender_id             integer NOT NULL,
    receiver_id           integer NOT NULL,
    content               text NOT NULL,
    sent_at               timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read_at               timestamp,
    application_id        integer,
    CONSTRAINT pk_messages PRIMARY KEY ( message_id )
);

---------------------------------------------------
---                   INDEXES                   ---
---------------------------------------------------
CREATE INDEX idx_conversation ON "public".messages ( sender_id, receiver_id, sent_at );
CREATE INDEX idx_unread ON "public".messages ( receiver_id, read_at );

---------------------------------------------------
---                 FOREIGN KEYS                ---
---------------------------------------------------
ALTER TABLE "public".advertisements 
    ADD CONSTRAINT fk_adv_company 
    FOREIGN KEY ( company_id ) REFERENCES "public".company( id_company ) ON DELETE CASCADE;

ALTER TABLE "public".applications 
    ADD CONSTRAINT fk_app_person 
    FOREIGN KEY ( person_id ) REFERENCES "public".people( person_id ) ON DELETE CASCADE;

ALTER TABLE "public".applications 
    ADD CONSTRAINT fk_app_adv 
    FOREIGN KEY ( advertisement_id ) REFERENCES "public".advertisements( advertisement_id ) ON DELETE CASCADE;

ALTER TABLE "public".company 
    ADD CONSTRAINT fk_companies_person 
    FOREIGN KEY ( person_id ) REFERENCES "public".people( person_id ) ON DELETE CASCADE;

ALTER TABLE "public".event_participants 
    ADD CONSTRAINT fk_ep_event 
    FOREIGN KEY ( event_id ) REFERENCES "public".events( event_id ) ON DELETE CASCADE;

ALTER TABLE "public".event_participants 
    ADD CONSTRAINT fk_ep_person 
    FOREIGN KEY ( person_id ) REFERENCES "public".people( person_id ) ON DELETE CASCADE;

ALTER TABLE "public".events 
    ADD CONSTRAINT fk_events_company 
    FOREIGN KEY ( company_id ) REFERENCES "public".company( id_company ) ON DELETE SET NULL;

ALTER TABLE "public".events 
    ADD CONSTRAINT fk_events_organizer 
    FOREIGN KEY ( organizer_id ) REFERENCES "public".people( person_id ) ON DELETE CASCADE;

ALTER TABLE "public".messages 
    ADD CONSTRAINT fk_messages_sender 
    FOREIGN KEY ( sender_id ) REFERENCES "public".people( person_id ) ON DELETE CASCADE;

ALTER TABLE "public".messages 
    ADD CONSTRAINT fk_messages_receiver 
    FOREIGN KEY ( receiver_id ) REFERENCES "public".people( person_id ) ON DELETE CASCADE;

ALTER TABLE "public".messages 
    ADD CONSTRAINT fk_messages_application 
    FOREIGN KEY ( application_id ) REFERENCES "public".applications( application_id ) ON DELETE SET NULL;