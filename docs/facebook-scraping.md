# Facebook Marketplace Scraping Notes

Facebook Marketplace pages change often and may block automated browsers. Keep scraping gentle:

- run every 10-15 minutes, not every minute,
- keep `SCRAPE_MAX_ITEMS` small,
- avoid aggressive parallel browser sessions,
- prefer one city URL and focused keywords,
- expect selectors to need updates over time.

The current scraper extracts visible Marketplace item anchors from the loaded page. If Facebook requires login or changes markup, the scraper may return zero items until updated.
