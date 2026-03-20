-- Migration: add 'failed' to email_event_type_enum
-- Safe: ALTER TYPE ... ADD VALUE is non-blocking in PostgreSQL 9.1+

ALTER TYPE "email_event_type_enum" ADD VALUE IF NOT EXISTS 'failed';
