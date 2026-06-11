# Apify & General Knowledge Q&A

---

## CPU & Memory

**How do you allocate more CPU for an Actor's run?**

You can set it up indirectly by setting a higher memory limit — Apify allocates 1 CPU core per 4 GB of memory.

---

**Can you change the allocated memory of an Actor while it's running?**

No. Memory (and therefore CPU) is allocated at run start time and cannot be changed while the Actor is running.

---

## Actor Runs & Metadata

**Within itself, can you get the exact time that an Actor was started?**

Yes, the start time is available in the run's metadata.

---

**What are the types of default storages connected to an Actor's run?**

Every Actor run gets 3 default storages:

- **Key-value store** — for saving data as key-value pairs
- **Dataset** — append-only storage for structured records (e.g. scraping results)
- **Request queue** — a queue of URLs to crawl

---

**Actors have an option in the Settings tab to "Restart on error". Would you use this feature for regular Actors? When would you use it?**

For regular Actors, probably not. If an Actor errors, blindly restarting it usually just repeats the same failure — you want to fix the bug instead. However, it can make sense when:

- The error is external (e.g. network timeouts, rate limiting)
- It's a long-running Actor where losing progress is expensive and retrying is cheaper than starting over

---

## Migrations & Persistence

**Migrations happen randomly, but by aborting gracefully, you can simulate a similar situation. What changes, and what remains the same for the restarted Actor's run?**

The Actor stopped but saved the data (e.g. `ASIN_COUNTER`) to the key-value store. On the next run, it pulled that value back and restored its state from it.

---

**Why don't you (usually) need to add any special migration handling code for a standard crawling/scraping Actor?**

Crawlee automatically persists the request queue to the key-value store, so if an Actor migrates mid-run, the queue of pending URLs is already saved. When the Actor resurrects, it picks up the queue and continues from where it left off — no extra code needed.

The only time you need custom migration handling is when you're maintaining your own in-memory state that isn't covered by Crawlee's built-in persistence.

---

**How can you intercept the migration event? How much time do you have after this event fires and before the Actor migrates? When would you persist data to the default key-value store instead of a named one?**

You can catch the event with the built-in method:

```js
Actor.on('migrating', () => { /* back up your state */ });
```

You have approximately **5 seconds** to back up before migration occurs.

Use the **default store** when data is only relevant to the current run's lifecycle. If you need data to persist across multiple runs, or access it from outside the Actor, use a **named key-value store**.

---

## Storage

**What are the differences between default (unnamed) and named storage? Which would you use for everyday usage?**

- **Unnamed storage** is deleted after a set period (e.g. 7 days)
- **Named storage** persists indefinitely until manually deleted by the owner

For everyday use, named storage is preferable when you need the data long-term.

---

**What is data retention, and how does it work for all storage types?**

Data retention is the policy for how long Apify keeps stored data before automatically deleting it. It applies the same way to all storage types:

| Storage type | What it holds |
|---|---|
| Dataset | Structured item lists |
| Key-value store | Arbitrary files / JSON |
| Request queue | URLs for crawlers |

---

## Apify API & Client

**What is the relationship between the Apify API and the Apify client? Are there any significant differences?**

- **Apify API** — the raw REST API; you write HTTP requests to endpoints manually
- **Apify client** — a library that wraps those same endpoints so you don't have to write raw HTTP requests yourself

In the end they do the same thing, but the client is more convenient.

---

**How do you pass input when running an Actor or task via API?**

Send it as a JSON body in the POST request when starting a run. That JSON body becomes what `Actor.getInput()` reads.

---

**Do you need to install the `apify-client` npm package when already using the `apify` package?**

In older SDK versions, `apify` included `apify-client` internally. In the current SDK (v3+), `apify-client` is a **separate package** and must be installed independently if you want to use it directly.

---

## Tasks

**What is the relationship between Actors and tasks?**

Tasks are saved input configurations for Actors, so you don't have to re-configure the input each time you run the Actor.

---

## Source Code & Deployment

**Do you have to rebuild an Actor each time the source code is changed?**

Yes.

---

**Based on your experience, is the `apify push` command worth using?**

It's quite useful for solo projects. For team projects, using a Git-based workflow (with CI/CD pipelines, commit history, etc.) is a better option.

---

## Puppeteer / Chrome

**How can you run an Actor with Puppeteer on the Apify platform with headless mode set to false?**

Use the `actor-node-puppeteer-chrome` Docker image and set `launchContext.launchOptions.headless` to `false` in `PuppeteerCrawlerOptions`.

---

## Proxies

**What are the different types of proxies that Apify offers? What are the main differences?**

| Proxy type | Speed | Cost | Detectability | Use case |
|---|---|---|---|---|
| Datacenter | Fast | Cheap | Detectable | General scraping |
| Residential | Slow | Expensive | Hard to detect | Sites with anti-bot |
| Google SERP | — | — | — | Google-only |

---

**Which proxy groups do users get on the free plan? Can they access it from their local machine?**

Free plan users get **shared datacenter proxies only**. They cannot use the proxy from their local machine — it can only be used from within Actor runs on the platform.

---

**How can you prevent an error if one of a user's proxy groups is removed?**

Best practices:

- Don't hardcode the proxy group — make the proxy config optional in the Actor's input so users can pass their own
- Wrap proxy creation in a `try/catch` block and either fall back to no proxy or log a clear error instead of crashing silently

---

**Does it make sense to rotate proxies when you are logged into a website?**

No. If you're logged in, your session is tied to a specific IP. Rotating the proxy mid-session would likely log you out or trigger a security challenge, since the site would see your account suddenly switching IPs.

---

**Construct a proxy URL that will select proxies only from the US.**

```js
const proxyConfiguration = await Actor.createProxyConfiguration({
  countryCode: 'US',
});
```

---

**What do you need to do to rotate a proxy? How does this differ for CheerioCrawler vs PuppeteerCrawler?**

A proxy pool (e.g. `ProxyConfiguration`) assigns a proxy URL per request. Since each proxy typically has one IP, "rotating" means cycling through different proxies from the pool. Apify's `ProxyConfiguration` handles this automatically — each call to `newUrl()` or `newProxyInfo()` returns a (potentially different) proxy URL.

**CheerioCrawler** uses plain HTTP requests, so rotation is straightforward:

```js
const proxyConfiguration = await Actor.createProxyConfiguration();
const crawler = new CheerioCrawler({
  proxyConfiguration,
  // Each request automatically gets a proxy URL
});
```

**PuppeteerCrawler / PlaywrightCrawler** use a full browser, so the proxy is set at browser launch time — you can't swap it mid-session. To rotate IPs you need a new browser launch, or use `SessionPool` to tie a session/browser to a proxy and retire it when you want a new IP.

---

## Anti-Scraping

**Name a few ways a website can prevent you from scraping it.**

- IP rate limiting
- Header inspection (checking `User-Agent`, `Referer`, etc.)
- URL pattern analysis
- Frequent structure changes on the website
- CAPTCHAs / bot detection challenges

---

## Debugging & Statistics

**Why might you want to store statistics about an Actor's run (or a specific request)?**

To have data available for debugging a failed request.

---

**In an Amazon scraper, you want to store the number of retries of a request once its data is pushed to the dataset. Where do you get this info, and where do you store it?**

Get it from `request.retryCount`. Store it as a field in the dataset item alongside the scraped data.

---

## Error Handling

**What is the difference between `failedRequestHandler` and `errorHandler`?**

- **`errorHandler`** — called before each retry, for requests that have failed fewer than `maxRequestRetries` times
- **`failedRequestHandler`** — called when a request has already exceeded `maxRequestRetries` and is considered permanently failed

---

## Git

**What is the difference between pushing changes and making a pull request?**

- **Pushing** — uploads your local commits to a remote branch (e.g. on GitHub). No review or approval needed.
- **Pull request** — a request to merge one branch into another. It's about asking for a review and approval before the branch gets merged.
