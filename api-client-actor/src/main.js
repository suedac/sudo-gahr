import { Actor, log } from 'apify';
await Actor.init();

const { memory, useClient, fields, maxItems } = await Actor.getInput();

const TASK_ID = 'sudo_apt_update~academy-amazon-scraper-task';
const TOKEN = process.env.APIFY_TOKEN;

let datasetId;

if (useClient) {
    const run = await Actor.apifyClient.task(TASK_ID).call({ memory });
    datasetId = run.defaultDatasetId;
} else {
    // Use the raw API - start the run
    const url = `https://api.apify.com/v2/actor-tasks/${TASK_ID}/runs?memory=${memory}`;
    const startRes = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const responseJson = await startRes.json();
    log.info('API response:', { response: responseJson });
    const { data: runData } = responseJson;
    const runId = runData.id;

    // Poll until finished
    let status = runData.status;
    let latestData = runData;
    while (status !== 'SUCCEEDED' && status !== 'FAILED') {
        await new Promise((r) => setTimeout(r, 3000));
        const pollRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
            headers: { Authorization: `Bearer ${TOKEN}` },
        });
        const { data } = await pollRes.json();
        status = data.status;
        latestData = data;
    }

    if (status === 'FAILED') throw new Error('Task run failed');
    datasetId = latestData.defaultDatasetId;
}
// Fetch items from the dataset
const { items } = await Actor.apifyClient.dataset(datasetId).listItems({
    fields,
    limit: maxItems,
});

// Convert to CSV
const header = fields.join(',');
const rows = items.map((item) => fields.map((f) => item[f] ?? '').join(','));
const csv = [header, ...rows].join('\n');

// Save to key-value store
await Actor.setValue('OUTPUT.csv', csv, { contentType: 'text/csv' });

await Actor.exit();
