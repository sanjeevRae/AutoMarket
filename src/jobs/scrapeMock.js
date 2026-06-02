process.env.SCRAPE_SOURCE = "mock";
process.env.SCRAPE_DRY_RUN = "true";

await import("./scrape.js");
