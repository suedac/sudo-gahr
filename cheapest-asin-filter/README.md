# Cheapest ASIN Filter

An Apify Actor that takes an Amazon scraper dataset and returns only the cheapest offer per ASIN.

## How it works

1. Fetches all items from the provided dataset
2. Groups offers by ASIN
3. For each ASIN, keeps only the offer with the lowest price
4. Pushes the filtered results to the default dataset

## Input

| Field | Type | Description |
|---|---|---|
| `datasetId` | string | The ID of the dataset from the Amazon scraper run. |

## Output

Each dataset item represents the cheapest offer found for a given ASIN:

```json
{
    "title": "Apple iPhone 15 128GB Black Unlocked",
    "asin": "B0CHX3QBCH",
    "itemUrl": "https://www.amazon.com/...",
    "description": "...",
    "keyword": "iphone",
    "sellerName": "Amazon.com",
    "offer": "$699.00",
    "price": 699
}
```

## Running locally

Requires an [Apify account](https://console.apify.com).

```bash
npm install
apify run
```

Input is read from `.actor/INPUT.json`. Example:

```json
{
    "datasetId": "your-dataset-id-here"
}
```

## Running on Apify

```bash
apify push
apify call
```