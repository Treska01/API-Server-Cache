import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";
import {log} from "./log.js";
let cachedRequestsExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

// Repository file data models cache
globalThis.cachedRequests = [];

export default class CachedRequestsManager {
    static add(url, content, ETag= "") {/* mise en cache */
        if (url != "") {
            this.clear(url);
            cachedRequests.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + cachedRequestsExpirationTime
            });
            console.log("Data for " + url + " added in cached requests");
        }
    }
    static find(url) {/* retourne la cache associée à l'url */
        try {
            if (url != "") {
                for (let cache of cachedRequests) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + cachedRequestsExpirationTime;
                        console.log("Data for " + url + " retreived from cached requests");
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log("cached request error!", error);
        }
        return null;
    }
    static clear(url) {/* efface la cache associée à l’url */
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of cachedRequests) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(cachedRequests, indexToDelete);
        }
    }
    static flushExpired() {/* efface les caches expirées */
        let indexToDelete = [];
        let index = 0;
        let now = utilities.nowInSeconds();
        for (let cache of cachedRequests) {
            if (cache.Expire_Time < now) {
                console.log("Cached request data of " + cache.url + " expired");
                indexToDelete.push(index);
            }
            index++;
        }
        utilities.deleteByIndex(cachedRequests, indexToDelete);
    }
    static get(HttpContext) {
        // Chercher la cache correspondant à l'url de la requête. Si trouvé,
        // Envoyer la réponse avec
        // HttpContext.response.JSON(payload, ETag, true /* from cache */)
        try {
            for (let cache of cachedRequests) {
                if (cache.url == HttpContext.req.url) {
                    // renew cache
                    cache.Expire_Time = utilities.nowInSeconds() + cachedRequestsExpirationTime;
                    console.log("Data for " + url + " retreived from cached requests");
                    HttpContext.response.JSON(cache.content, cache.ETag, true /* from cache */);
                }
            }
        } catch (error) {
            console.log("cached request error!", error);
        }
    }
}
// periodic cleaning of expired cached repository data
setInterval(CachedRequestsManager.flushExpired, cachedRequestsExpirationTime * 1000);
log(BgWhite, FgBlack, "Periodic cached requests cleaning process started...");
/**/