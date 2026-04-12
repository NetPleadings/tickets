# Run development server locally
dev:
    bunx --bun vite dev

# Create BigQuery dataset and tables in minutebox-marketing
setup-bq:
    bq --project_id=minutebox-marketing mk --dataset tickets
    bq --project_id=minutebox-marketing mk --table tickets.allocations \
        id:STRING,event_id:STRING,seat_id:STRING,assignee:STRING,assignee_email:STRING,status:STRING,assigned_by:STRING,assigned_at:TIMESTAMP,notes:STRING,is_guest:BOOLEAN,guest_company:STRING
    bq --project_id=minutebox-marketing mk --table tickets.guests \
        id:STRING,name:STRING,company:STRING,email:STRING,notes:STRING,created_at:TIMESTAMP
    gcloud projects add-iam-policy-binding minutebox-marketing \
        --member="serviceAccount:tickets-runtime@minutebox-marketing.iam.gserviceaccount.com" \
        --role="roles/bigquery.dataEditor" --quiet
    gcloud projects add-iam-policy-binding minutebox-marketing \
        --member="serviceAccount:tickets-runtime@minutebox-marketing.iam.gserviceaccount.com" \
        --role="roles/bigquery.jobUser" --quiet

# Create BigQuery tables for ticket banking & exchange system
setup-banking-bq:
    bq --project_id=minutebox-marketing mk --table tickets.ticket_bank_inventory \
        id:STRING,source_event_id:STRING,source_game_date:STRING,ticket_class:STRING,section:STRING,row:STRING,seat:STRING,quantity:INTEGER,status:STRING,banked_by:STRING,banked_at:TIMESTAMP,notes:STRING,created_at:TIMESTAMP,updated_at:TIMESTAMP
    bq --project_id=minutebox-marketing mk --table tickets.ticket_exchange_rules \
        id:STRING,name:STRING,from_ticket_class:STRING,from_quantity:INTEGER,to_ticket_class:STRING,to_quantity:INTEGER,active:BOOLEAN,notes:STRING,created_by:STRING,created_at:TIMESTAMP,updated_at:TIMESTAMP
    bq --project_id=minutebox-marketing mk --table tickets.ticket_exchange_transactions \
        id:STRING,rule_id:STRING,rule_name:STRING,target_event_id:STRING,target_game_date:STRING,from_ticket_class:STRING,from_quantity:INTEGER,to_ticket_class:STRING,to_quantity:INTEGER,status:STRING,performed_by:STRING,notes:STRING,created_at:TIMESTAMP
    bq --project_id=minutebox-marketing mk --table tickets.ticket_exchange_transaction_items \
        id:STRING,transaction_id:STRING,bank_inventory_id:STRING,quantity_consumed:INTEGER,created_at:TIMESTAMP

# Migrate local allocations.json into BigQuery
migrate:
    bun scripts/migrate.ts
    bq load --source_format=NEWLINE_DELIMITED_JSON --project_id=minutebox-marketing tickets.allocations /tmp/allocations.ndjson

# Build and deploy to Cloud Run
deploy:
    bun i
    bunx --bun vite build
    gcloud run deploy app-tickets \
        --source . \
        --region us-central1 \
        --project minutebox-marketing \
        --platform managed \
        --service-account tickets-runtime@minutebox-marketing.iam.gserviceaccount.com

# Create the runtime service account in minutebox-marketing
create-service-account:
    gcloud iam service-accounts create tickets-runtime \
        --display-name="Tickets Runtime" \
        --project=minutebox-marketing

# Add DNS record for tickets.minutebox.com pointing to Cloud Run
add-dns-record:
    gcloud dns record-sets create tickets.minutebox.com \
        --type=CNAME \
        --rrdatas="ghs.googlehosted.com." \
        --zone=minutebox-com \
        --project=mb-global
