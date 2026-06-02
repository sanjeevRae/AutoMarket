import { env } from "./env.js";

const nepalLocations = [
  { name: "Kathmandu", id: "106085869430478" },
  { name: "Lalitpur", id: "205246402885806" },
  { name: "Jawalakhel", id: "103530669681415" },
  { name: "Bhaktapur", id: "107541015941651" },
  { name: "Banepa", id: "107542912605474" },
  { name: "Nepaltar", id: "105551836140585" }
];

const marketplaceCategorySlugs = [
  { name: "iPhones", slug: "iphones" },
  { name: "Mobile phones", slug: "mobile-phones" },
  { name: "Cell phones", slug: "cell-phones" }
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
      .slice(0, env.MARKETPLACE_MAX_TARGETS);
  }

  const generatedTargets = [];

  for (const location of nepalLocations) {
    for (const category of marketplaceCategorySlugs) {
      generatedTargets.push({
        name: `${location.name} ${category.name}`,
        locationName: location.name,
        marketplaceUrl: `https://www.facebook.com/marketplace/${location.id}/${category.slug}/`
      });
    }
  }

  return generatedTargets.slice(0, env.MARKETPLACE_MAX_TARGETS);
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
