import {
    Worker, isMainThread, parentPort, workerData
} from 'worker_threads';
import config from './config.json';
import fs from 'fs';
import { WorkerData, CrawlResult, CrawlerMatch, RecursiveUrl } from './types';

const urlVisited = new Set<string>();
const urlLeftToVisit = new Set<RecursiveUrl>();
const simpleUrlLeftToVisit = new Set<string>();
const allMatches : CrawlerMatch[] = []
const currentWorkers = new Set<Worker>();
let IHMServerWorker: Worker;
const startingUrl = process.argv[2];
const regexToMatch = process.argv[3];

let crawlerId = 0;

if (!startingUrl || !regexToMatch) {
    throw new Error('Usage : node index.js <url> <regex_pattern>');
}

if(config.dumpHtml) {
    console.log(`[MAIN] - Creating dump folder`);
    if (!fs.existsSync('dump')) {
        fs.mkdirSync('dump');
    }else{
        fs.rmdirSync('dump', { recursive: true });
        fs.mkdirSync('dump');
    }
}

urlLeftToVisit.add({ currentDepth: 0, newUrl: startingUrl, crawlerId: crawlerId } as RecursiveUrl);

function startIHMServer() {
    console.log(`[MAIN] - Starting IHM server`);
    IHMServerWorker = new Worker("./src/IHMServer.ts", {});
}

function updateIHMData() {
    console.log(`[MAIN] - Sending data to IHM server`);

    IHMServerWorker.postMessage({
        urlVisited: urlVisited,
        urlLeftToVisit: urlLeftToVisit,
        matches: allMatches
    });
}

function launchUrlCrawl(urlToCrawl: RecursiveUrl) {
    const worker = new Worker("./src/crawler.ts", {
        workerData: {
            urlToCrawl: urlToCrawl,
            regexToMatch: regexToMatch,
            urlVisited: urlVisited,
            crawlerId: crawlerId++
        } as WorkerData,
    });

    worker.on('message', (message: CrawlResult) => {
        const { newUrls, matches, crawlerId } = message as CrawlResult;

        console.log(`[MAIN] - Received message from worker#${crawlerId}`, `${matches.length} matches`, `${newUrls.length} new urls`);

        matches.forEach((match: CrawlerMatch) => {
            allMatches.push(match);
        });

        newUrls.forEach((newUrl: RecursiveUrl) => {
            if (urlVisited.has(newUrl.newUrl) || simpleUrlLeftToVisit.has(newUrl.newUrl)) {
                return;
            }

            if(newUrl.currentDepth >= config.maxDepth) {
                return;
            }

            urlLeftToVisit.add(newUrl);
            simpleUrlLeftToVisit.add(newUrl.newUrl);
        });

        currentWorkers.delete(worker);
        updateIHMData();
    });

    currentWorkers.add(worker);
}

startIHMServer();

setInterval(() => {
    if (urlLeftToVisit.size > 0) {
        let nbWorkersToStart = Math.min(config.maxNbWorkers - currentWorkers.size, urlLeftToVisit.size);
        for (let i = 0; i < nbWorkersToStart; i++) {
            const urlToVisit = urlLeftToVisit.values().next().value;

            urlLeftToVisit.delete(urlToVisit);
            urlVisited.add(urlToVisit.newUrl);
            simpleUrlLeftToVisit.delete(urlToVisit.newUrl);

            launchUrlCrawl(urlToVisit);
        }
    }


}, config.delayBetweenUrlChecks);

