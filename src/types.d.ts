export interface CrawlResult {
    newUrls : RecursiveUrl[]
    matches : CrawlerMatch[],
    crawlerId: number
}

export interface RecursiveUrl {
    currentDepth : number
    newUrl: string
}

export interface WorkerData {
    urlToCrawl: RecursiveUrl
    regexToMatch: string
    urlVisited: Set<string>
    crawlerId: number
}

export interface CrawlerMatch {
    where: string
    what: string
}

export interface GeneralCrawlStatus {
    urlVisited : Set<RecursiveUrl>
    urlLeftToVisit : Set<RecursiveUrl>
    matches : CrawlerMatch[]
}