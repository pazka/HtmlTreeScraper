require('ts-node').register(); //necessary for worker scripts to be able to run typescript

import express from 'express';
import fs from 'fs';
import {
    isMainThread, parentPort
} from 'worker_threads';
import config from './config.json';
import { GeneralCrawlStatus } from "./types";

if (isMainThread || !parentPort) {
    throw new Error('This file should not be executed directly, use index.ts');
}

const app = express()

let generalCrawlStatus: GeneralCrawlStatus = {
    urlVisited: new Set(),
    urlLeftToVisit: new Set(),
    matches: []
}

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile('public/index.html', { root: __dirname })
})

app.get('/status', (req, res) => {
    res.json({
        urlVisited: Array.from(generalCrawlStatus.urlVisited),
        urlLeftToVisit: Array.from(generalCrawlStatus.urlLeftToVisit),
        matches: generalCrawlStatus.matches
    })
})

app.listen(config.port, () => {
    console.log('[IHM] : IHM Server started at', 'http://localhost:' + config.port)
})

parentPort?.on('message', (message: GeneralCrawlStatus) => {
    //dump all data in a index.html file
    generalCrawlStatus = message

    if (config.dumpCrawlerData) {
        fs.writeFileSync('crawlerData.dump', JSON.stringify(generalCrawlStatus, null, 2))
    }

    if(config.dumpCrawlerMatches) {
        fs.writeFileSync('crawlerMatches.dump', JSON.stringify(generalCrawlStatus.matches, null, 2))
    }
})