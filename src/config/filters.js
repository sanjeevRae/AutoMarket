import { env } from "./env.js";

const nepalLocations = [
  { name: "Kathmandu", id: "106085869430478" },
  { name: "Lalitpur", id: "205246402885806" },
  { name: "Jawalakhel", id: "103530669681415" },
  { name: "Bhaktapur", id: "107541015941651" },
  { name: "Banepa", id: "107542912605474" },
  { name: "Nepaltar", id: "105551836140585" },
  { name: "Nepal location 105881199440434", id: "105881199440434" },
  { name: "Nepal location 112951728719008", id: "112951728719008" },
  { name: "Nepal location 100242253350992", id: "100242253350992" },
  { name: "Nepal location 107660619264051", id: "107660619264051" },
  { name: "Nepal location 105676396131853", id: "105676396131853" },
  { name: "Nepal location 112869382061213", id: "112869382061213" },
  { name: "Nepal location 107463885943322", id: "107463885943322" },
  { name: "Nepal location 104035086300631", id: "104035086300631" },
  { name: "Nepal location 109264042433998", id: "109264042433998" },
  { name: "Nepal location 108540865837567", id: "108540865837567" }
];

const marketplaceCategorySlugs = [
  { name: "iPhones", slug: "iphones" },
  { name: "Mobile phones", slug: "mobile-phones" },
  { name: "Cell phones", slug: "cell-phones" }
];

const marketplaceSearchQueries = [
  "iphone",
  "samsung",
  "redmi",
  "vivo",
  "oppo",
  "realme",
  "oneplus",
  "nothing phone",
  "iphone 13",
  "iphone 14",
  "iphone 15",
  "iphone 16",
  "iphone 17",
  "iphone 11",
  "iphone 12",
  "pixel"
];

function getMarketplaceTargets() {
  if (env.MARKETPLACE_URLS) {
    return env.MARKETPLACE_URLS.split(";")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url, index) => ({
        name: `Custom Nepal target ${index + 1}`,
        marketplaceUrl: url
      }))
      .slice(env.MARKETPLACE_TARGET_OFFSET, env.MARKETPLACE_TARGET_OFFSET + env.MARKETPLACE_MAX_TARGETS);
  }

  const generatedTargets = [];
  const locations = uniqueLocations(nepalLocations);

  if (env.MARKETPLACE_TARGET_MODE === "search" || env.MARKETPLACE_TARGET_MODE === "hybrid") {
    for (const location of locations) {
      for (const query of marketplaceSearchQueries) {
        generatedTargets.push({
          name: `${location.name} search ${query}`,
          locationName: location.name,
          searchQuery: query,
          marketplaceUrl: buildSearchUrl(location.id, query)
        });
      }
    }
  }

  if (env.MARKETPLACE_TARGET_MODE === "category" || env.MARKETPLACE_TARGET_MODE === "hybrid") {
    for (const location of locations) {
      for (const category of marketplaceCategorySlugs) {
        generatedTargets.push({
          name: `${location.name} ${category.name}`,
          locationName: location.name,
          marketplaceUrl: `https://www.facebook.com/marketplace/${location.id}/${category.slug}/`
        });
      }
    }
  }

  return generatedTargets.slice(env.MARKETPLACE_TARGET_OFFSET, env.MARKETPLACE_TARGET_OFFSET + env.MARKETPLACE_MAX_TARGETS);
}

function buildSearchUrl(locationId, query) {
  const params = new URLSearchParams({
    query,
    exact: "false",
    sortBy: "creation_time_descend"
  });

  return `https://www.facebook.com/marketplace/${locationId}/search/?${params.toString()}`;
}

function uniqueLocations(locations) {
  const seen = new Set();
  return locations.filter((location) => {
    if (seen.has(location.id)) return false;
    seen.add(location.id);
    return true;
  });
}

export const filters = {
  marketplaceTargets: getMarketplaceTargets(),
  categories: [
    {
      id: "iphone",
      label: "iPhone",
      keywords: [
        "iphone",
        "i phone",
        "apple iphone",
        "iphone x",
        "iphone xr",
        "iphone xs",
        "iphone 10",
        "iphone 11",
        "iphone 12",
        "iphone 13",
        "iphone 14",
        "iphone 15",
        "iphone 16",
        "iphone 17",
        "iphone se",
        "iphone pro",
        "iphone pro max",
        "iphone plus",
        "icloud lock"
      ],
      minPrice: 5000,
      maxPrice: 300000
    },
    {
      id: "android",
      label: "Android Phone",
      keywords: [
        "android",
        "samsung",
        "galaxy",
        "vivo",
        "oppo",
        "realme",
        "redmi",
        "xiaomi",
        "poco",
        "oneplus",
        "nothing phone",
        "nothing",
        "cmf phone",
        "cmf by nothing",
        "pixel",
        "google pixel",
        "huawei",
        "honor",
        "infinix",
        "tecno",
        "nokia",
        "motorola",
        "moto",
        "iqoo",
        "zte",
        "nubia",
        "asus rog",
        "rog phone",
        "sony xperia",
        "lg phone",
        "meizu",
        "black shark",
        "phone 1",
        "phone 2",
        "phone 3"
      ],
      minPrice: 3000,
      maxPrice: 250000
    }
  ]
};
