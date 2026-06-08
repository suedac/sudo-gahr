

How do you allocate more CPU for an Actor's run?
    -You can set it up indirectly by seting up more memory limit(1 CPU core per 4 GB of memory allocated).

Within itself, can you get the exact time that an Actor was started?
    -Yes, the start time is available in the runs metadata.

What are the types of default storages connected to an Actor's run?
-every Actor run gets 3 default storages:
    -key-value store (for saving data as key-value pairs)
    -Dataset (append-only storage for structured records *like scraping results*)
    -Request queue (a queue of urls to crawl)

Can you change the allocated memory of an Actor while it's running?
    -No. Memory (and thus CPU) is allocated at run start time and cannot be changed while the Actor is running.

How can you run an Actor with Puppeteer on the Apify platform with headless mode set to false?
    -It is possible to do by using the actor-node-puppeteer-chrome Docker image and making sure that launchContext.launchOptions.headless in PuppeteerCrawlerOptions is set to false.

Do you have to rebuild an Actor each time the source code is changed?
    -Yes.

In Git, what is the difference between pushing changes and making a pull request?
    -Pushing means uploading your local commits to a remote branch on github(or whatever platform you/your team is using). So there is no review, no approval needed.
    On the other hand a pull request is a request to merge one branch to another. It's about asking for a review and approval before your branch gets merged.
    
Based on your knowledge and experience, is the apify push command worth using (in your opinion)?
    -It's pretty good if you are doing a solo project but if you are doing a team project using git control systems is a better option(CI/CD pipelines, commit history etc)