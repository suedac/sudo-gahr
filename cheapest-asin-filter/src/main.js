import { Actor } from 'apify';

await Actor.init();

const { datasetId } = await Actor.getInput();
const { items } = await Actor.apifyClient.dataset(datasetId).listItems();

const cheapestByAsin = {};

for (const item of items) {
    const price = parseFloat(item.offer?.replace(/[^0-9.]/g, '')); // Strip currency symbols and formatting (e.g. "$1,299.00" → "1299.00").
    if (isNaN(price)) continue;

    const existing = cheapestByAsin[item.asin];
    if (!existing || price < existing.price) {
        cheapestByAsin[item.asin] = { ...item, price };
    }
}

await Actor.pushData(Object.values(cheapestByAsin));

await Actor.exit();
