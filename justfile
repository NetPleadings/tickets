# Run development server locally
dev:
    bunx --bun vite dev

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
