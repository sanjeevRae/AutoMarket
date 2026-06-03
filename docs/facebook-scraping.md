# Facebook Marketplace Scraping Notes

Facebook Marketplace pages change often and may block automated browsers. Keep scraping gentle:

- run every 10-15 minutes, not every minute,
- keep `SCRAPE_MAX_ITEMS` small,
- avoid aggressive parallel browser sessions,
- prefer one city URL and focused keywords,
- expect selectors to need updates over time.

The current scraper extracts visible Marketplace item anchors from the loaded page. If Facebook requires login or changes markup, the scraper may return zero items until updated.

## Listed Time

`Listed_time` only works when Facebook exposes the listing date/time to the browser. If the detail backfill report shows only:

```text
Log in
Sign Up
Log In
```

then Facebook is hiding the listing detail page from the logged-out GitHub runner. In that case the scraper cannot read the real Marketplace listed date.

To let Playwright see the same Marketplace page as a logged-in browser, add a GitHub secret named `FACEBOOK_COOKIES_JSON`. The value must be a JSON array of Facebook cookies exported from a browser session that can open Marketplace. Treat this secret like a password. Use a separate Facebook account for automation and expect the session to expire or require refresh.
