-- Ticket Banking & Exchange System — BigQuery Schema
-- Dataset: minutebox-marketing.tickets
--
-- Setup: run `just setup-banking-bq` to create all tables via bq CLI,
-- or execute each CREATE TABLE statement below in the BigQuery console.
--
-- These tables are additive — they do not modify existing tables.

-- Banked ticket inventory (shared team pool)
CREATE TABLE IF NOT EXISTS `minutebox-marketing.tickets.ticket_bank_inventory` (
  id STRING NOT NULL,
  source_event_id STRING NOT NULL,
  source_game_date STRING NOT NULL,
  ticket_class STRING NOT NULL,
  section STRING,
  row STRING,
  seat STRING,
  quantity INT64 NOT NULL DEFAULT 1,
  status STRING NOT NULL DEFAULT 'available',  -- available | partially_used | used | cancelled
  banked_by STRING,
  banked_at TIMESTAMP,
  notes STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Exchange rules (admin-configured ratios)
CREATE TABLE IF NOT EXISTS `minutebox-marketing.tickets.ticket_exchange_rules` (
  id STRING NOT NULL,
  name STRING NOT NULL,
  from_ticket_class STRING NOT NULL,
  from_quantity INT64 NOT NULL DEFAULT 1,
  to_ticket_class STRING NOT NULL,
  to_quantity INT64 NOT NULL DEFAULT 1,
  active BOOL NOT NULL DEFAULT TRUE,
  notes STRING,
  created_by STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Exchange transaction log (append-only audit trail)
CREATE TABLE IF NOT EXISTS `minutebox-marketing.tickets.ticket_exchange_transactions` (
  id STRING NOT NULL,
  rule_id STRING NOT NULL,
  rule_name STRING NOT NULL,
  target_event_id STRING NOT NULL,
  target_game_date STRING NOT NULL,
  from_ticket_class STRING NOT NULL,
  from_quantity INT64 NOT NULL,
  to_ticket_class STRING NOT NULL,
  to_quantity INT64 NOT NULL,
  status STRING NOT NULL DEFAULT 'completed',  -- completed | cancelled
  performed_by STRING,
  notes STRING,
  created_at TIMESTAMP
);

-- Exchange transaction line items (which banked inventory was consumed)
CREATE TABLE IF NOT EXISTS `minutebox-marketing.tickets.ticket_exchange_transaction_items` (
  id STRING NOT NULL,
  transaction_id STRING NOT NULL,
  bank_inventory_id STRING NOT NULL,
  quantity_consumed INT64 NOT NULL,
  created_at TIMESTAMP
);
