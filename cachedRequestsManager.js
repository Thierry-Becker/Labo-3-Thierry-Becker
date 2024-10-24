import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";

let requestsCacheExpirationTime = serverVariables.get("main.requests.CacheExpirationTime");

global.requestsCache = [];
global.cachedRequestsCleanerStarted = false;
export class CachedRequestsManager
{
    static startCachedRequestsCleaner(){
        /* démarre le processus de nettoyage des caches périmées */
        setInterval(RepositoryCachesManager.flushExpired, repositoryCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic request data caches cleaning process started...]"); 
    }
    static add(url, content, ETag= "") {
        /* mise en cache */
        if(!cachedRequestsCleanerStarted){
            cachedRequestsCleanerStarted=true;
            CachedRequestsManager.startCachedRequestsCleaner;
        }
        if(url!=""){
            CachedRequestsManager.clear(url);
        requestsCache.push({
            url,
            content,
            ETag,
            Expire_Time: utilities.nowInSeconds() + requestsCacheExpirationTime
        });
        console.log(BgWhite + FgBlue, `[Data of ${url} has been cached]`);
        }
    }
    static find(url) {
        /* retourne la cache associée à l'url */
        try {
            if (url != "") {
                for (let cache of requestsCache) {
                    if (cache.url == url) {
                        cache.Expire_Time = utilities.nowInSeconds() + requestsCacheExpirationTime;
                        console.log(BgWhite + FgBlue, `[${url} data retrieved from cache]`);
                        return cache.data;
                    }
                }
            }
        }
        catch(error) {
            console.log(BgWhite + FgRed, "[Request cache error!]", error);
        }
        return null;
    }
    static clear(url) {
        /* efface la cache associée à l’url */
        if(url!=""){
            let indexToDelete = [];
            let index = 0;
            for (let cache of requestsCache) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            console.log("Retrait de cache expirée avec l’url: "+url +" associé")
            utilities.deleteByIndex(requestsCache, indexToDelete);
        }
    }
    static flushExpired() {
        /* efface les caches expirées */
        let now = utilities.nowInSeconds();
        for (let cache of requestsCache) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data of " + cache.url + " expired");
            }
        }
        requestsCache = requestsCache.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext) {/*
        Chercher la cache correspondant à l'url de la requête. Si trouvé,
        Envoyer la réponse avec*/
        let cacheData = CachedRequestsManager.find(HttpContext.req.url)

        if(cacheData){
            console.log("Extraction de la cache avec l’url: "+ HttpContext.req.url+" associé")
            HttpContext.response.JSON( cacheData.content, cacheData.ETag, true /* from cache */);
        }
    }
}