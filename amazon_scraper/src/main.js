import { Actor } from "apify";
import { CheerioCrawler, log } from "crawlee";
import { router } from "./routes.js";
import { BASE_URL, labels } from "./constants.js";
import { asinCounts, runStats } from "./state.js";

await Actor.init();

const { keyword = "iphone" } = (await Actor.getInput()) ?? {};

const proxyConfiguration = await Actor.createProxyConfiguration({
  groups: ["RESIDENTIAL"],
  countryCode: "US",
});

const crawler = new CheerioCrawler({
  proxyConfiguration,
  maxRequestRetries: 10,
  useSessionPool: true,
  sessionPoolOptions: {
    sessionOptions: {
      maxUsageCount: 5,
    },
  },
  requestHandler: router,
  failedRequestHandler: ({ request, session }) => {
    const url = request.url;
    const errorMessage = request.errorMessages?.at(-1) ?? "Unknown error :(";

    if (!runStats.errors[url]) {
      runStats.errors[url] = [];
    }
    runStats.errors[url].push(errorMessage);

    session?.markBad();
  },
});
log.info("Starting the crawl.");
const logInterval = setInterval(() => {
  console.log("ASIN counts:", JSON.stringify(asinCounts));
  console.log("Run stats:", JSON.stringify(runStats));
}, 10000);
Actor.on("migrating", async () => {
  await Actor.setValue("ASIN_COUNTS", asinCounts);
  await Actor.setValue("RUN_STATS", runStats);
});

const savedCounts = await Actor.getValue("ASIN_COUNTS");
const savedStats = await Actor.getValue("RUN_STATS");

if (savedStats) {
  Object.assign(runStats, savedStats);
}
if (savedCounts) {
  Object.assign(asinCounts, savedCounts);
}

await crawler.run([
  {
    url: `${BASE_URL}/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=${keyword}`,
    label: labels.START,
    userData: { keyword },
  },
]);
clearInterval(logInterval);
log.info("Crawl finished.");

await Actor.exit();
