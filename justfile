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
