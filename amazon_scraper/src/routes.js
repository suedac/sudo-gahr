import { createCheerioRouter, Dataset } from 'crawlee';
import { BASE_URL, labels } from './constants.js';
import { asinCounts, runStats } from './state.js';
export const router = createCheerioRouter();

router.addHandler(labels.START, async ({ $, crawler, request }) => {
    const { keyword } = request.userData;

    const products = $('div > div[data-asin]:not([data-asin=""])');

    for (const product of products) {
        const element = $(product);
        const titleElement = $(element.find('.a-text-normal[href]'));

        const href = titleElement.attr('href');
        if (!href) continue;

        const url = `${BASE_URL}${href}`;

        await crawler.addRequests([{
            url,
            label: labels.PRODUCT,
            userData: {
                data: {
                    title: titleElement.first().text().trim(),
                    asin: element.attr('data-asin'),
                    itemUrl: url,
                    keyword,
                },
            },
        }]);
    }
});

router.addHandler(labels.PRODUCT, async ({ $, crawler, request }) => {
    const { data } = request.userData;

    const description = $('div#productDescription').text().trim();

    await crawler.addRequests([{
        url: `${BASE_URL}/dp/${data.asin}?th=1&psc=1`,
        label: labels.OFFERS,
        userData: {
            data: {
                ...data,
                description,
            },
        },
    }]);
});

router.addHandler(labels.OFFERS, async ({ $, request, crawler }) => {
    const { data } = request.userData;

    const price = $('.a-price .a-offscreen').first().text().trim();
    const sellerName = $('#sellerProfileTriggerId, #merchant-info a').first().text().trim();

    const requestQueue = await crawler.getRequestQueue();
    const queueInfo = await requestQueue.getInfo();

    const asin = data.asin;
    asinCounts[asin] = (asinCounts[asin] ?? 0) + 1;

    await Dataset.pushData({
        ...data,
        sellerName,
        offer: price,
        dateHandled: new Date().toISOString(),
        numberOfRetries: request.retryCount,
        currentPendingRequests: queueInfo.pendingRequestCount,
    });
    runStats.totalSaved++;
});
