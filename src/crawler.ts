require('ts-node').register(); //necessary for worker scripts to be able to run typescript

import axios from "axios";
import config from "./config.json";
import fs from "fs";

import {
    Worker, isMainThread, parentPort, workerData
} from 'worker_threads';
import { WorkerData, CrawlerMatch, CrawlResult, RecursiveUrl } from "./types";

if (isMainThread || !parentPort) {
    throw new Error('This file should not be executed directly, use index.ts');
}

(async () => {
    const { urlToCrawl, regexToMatch, urlVisited, crawlerId }: WorkerData = workerData;
    let newUrls: RecursiveUrl[] = []
    let matches: CrawlerMatch[] = []

    console.log(`[Crawler#${crawlerId}] - Received url to crawl`, urlToCrawl);
    let response;
    try {
        response = await axios.get(urlToCrawl.newUrl);
    } catch (e) {
        console.error(`[Crawler#${crawlerId}] - Error while crawling url`, urlToCrawl);
        return;
    }

    //test if the data is really html
    if (!response.headers['content-type'].includes('text/html')) {
        return;
    }

    const html = response.data;

    if (config.dumpHtml) {
        fs.writeFileSync(`dump/crawler_${crawlerId}.dump.html`, html);
    }

    //search for matches
    const rawMatches = html.match(new RegExp(regexToMatch, 'g'));
    if (rawMatches) {
        console.log(`[Crawler#${crawlerId}] - Found ${rawMatches.length} matches !! `);

        matches = rawMatches.map((match: string) => {
            return {
                where: urlToCrawl.newUrl,
                what: match
            }
        });
    }

    const urls = extractAbsoluteUrlsFromHtml(urlToCrawl.newUrl, html);
    if (!urls) {
        return;
    }

    urls.forEach((url: string) => {
        if (urlVisited.has(url)) {
            return
        }

        const potentialUrl = { currentDepth: urlToCrawl.currentDepth + 1, newUrl: url, crawlerId } as RecursiveUrl;

        for (const paternToIgnore of config.ignoreUrlPatterns) {
            if (new RegExp(paternToIgnore).test(url)) {
                return;
            }
        }

        for (const paternToFollow of config.followUrlPatterns) {
            if (!new RegExp(paternToFollow).test(url)) {
                return;
            }
        }

        newUrls.push(potentialUrl);
    });

    console.log(`[Crawler#${crawlerId}] - Crawled url,sending to main`, urlToCrawl);
    parentPort?.postMessage({ newUrls, matches, crawlerId } as CrawlResult);
})();


function extractAbsoluteUrlsFromHtml(srcUrl: string, html: string): string[] {
    const baseUrl = new URL(srcUrl);
    const protocol = baseUrl.protocol;
    const host = baseUrl.host;

    const matchedUrls: string[] = []

    //case  href="spip.php?..."
    const hrefRegex = /href="([^"]*)"/g;
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
        const url = match[1];
        if (url.startsWith('http')) {
            matchedUrls.push(url);
        } else if (url.startsWith('/')) {
            matchedUrls.push(`${protocol}//${host}${url}`);
        } else {
            matchedUrls.push(`${srcUrl}/${url}`);
        }
    }

    //case http:// or https://
    const httpRegex = /http[s]*:\/\/[^'"]+/g;
    while ((match = httpRegex.exec(html)) !== null) {
        matchedUrls.push(match[0]);
    }

    //case www.qsd.com
    const wwwRegex = /[^'"]{,5}\.[^'"]+\.[^'"]{2,3}/g;
    while ((match = wwwRegex.exec(html)) !== null) {
        matchedUrls.push(`https://${match[0]}`);
    }

    matchedUrls.forEach((url: string, index: number) => {
        matchedUrls[index] = cleanUrl(url);
    });

    return matchedUrls
}

function cleanUrl(url: string): string {
    //remove line return, spaces, double slashes not after http(s)
    url = url.trim();

    url = url.replace('\t', '');
    url = url.replace('\r', '');
    url = url.replace('\n', '');

    //remove spaces
    url = url.replace(/ /g, '');

    //remove double slashes
    url = url.replace(/([^:]\/)\/+/g, '$1');

    return url;
}