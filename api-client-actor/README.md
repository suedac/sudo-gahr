# API Client Actor

An Apify Actor that runs the Academy Amazon Scraper task and exports the results as a CSV file. Supports both the Apify JavaScript client and the raw Apify REST API.

## How it works

1. Starts the Amazon scraper task using either the Apify JS client or the raw REST API (controlled by the `useClient` input)
2. Waits for the task run to finish
3. Fetches the dataset items, filtered to the specified fields
4. Saves the result as a CSV file to the key-value store under `OUTPUT.csv`

## Input

| Field | Type | Description |
|---|---|---|
| `memory` | integer | Memory in MB to allocate to the task run. Must be a power of 2 (e.g. 256, 512, 1024). |
| `useClient` | boolean | If `true`, uses the Apify JS client. If `false`, uses the raw REST API. |
| `fields` | array of strings | Fields to include in the CSV output. All other fields are omitted. |
| `maxItems` | integer | Maximum number of items to include in the output. |

## Output

A CSV file saved to the key-value store under the key `OUTPUT.csv`. Each row represents one offer from the Amazon scraper, with columns matching the `fields` input.

Example with `fields: ["title", "offer", "sellerName"]`:

```csv
title,offer,sellerName
Apple iPhone 15 128GB Black Unlocked,$699.00,Amazon.com
```

## Running locally

Requires an [Apify account](https://console.apify.com) and a valid `APIFY_TOKEN` environment variable.

```bash
npm install
apify run
```

Input is read from `.actor/INPUT.json`. Example:

```json
{
    "memory": 512,
    "useClient": true,
    "fields": ["title", "offer", "sellerName"],
    "maxItems": 10
}
```

## Running on Apify

```bash
apify push
apify call
```