CREATE TABLE "buildings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"je_id" integer,
	"floors" integer DEFAULT 1 NOT NULL,
	"area" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buildings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"parent_id" integer,
	"level" integer DEFAULT 1 NOT NULL,
	"trade" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complaint_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"complaint_id" integer NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"staff_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"docket_number" text NOT NULL,
	"building_id" integer NOT NULL,
	"floor" text,
	"room" text,
	"category_id" integer,
	"subcategory_id" integer,
	"type_id" integer,
	"category_label" text,
	"other_text" text,
	"priority" text DEFAULT 'Minor' NOT NULL,
	"preferred_at" timestamp with time zone,
	"photo_url" text,
	"status" text DEFAULT 'Registered' NOT NULL,
	"complainant_name" text,
	"complainant_email" text NOT NULL,
	"assigned_technician_id" integer,
	"technician_trade" text,
	"expected_start" date,
	"assign_remarks" text,
	"je_id" integer,
	"reactivation_suffix" integer DEFAULT 0 NOT NULL,
	"parent_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	CONSTRAINT "complaints_docket_number_unique" UNIQUE("docket_number")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"complaint_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"channel" text DEFAULT 'Email' NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	CONSTRAINT "notification_templates_event_unique" UNIQUE("event")
);
--> statement-breakpoint
CREATE TABLE "sla_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"priority" text NOT NULL,
	"hours" integer NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "sla_rules_priority_unique" UNIQUE("priority")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'JE' NOT NULL,
	"subdivision" text,
	"building_id" integer,
	"ae_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" serial PRIMARY KEY NOT NULL,
	"respondent_email" text,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technicians" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trade" text NOT NULL,
	"contact" text,
	"area" text,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'User' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
