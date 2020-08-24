import ext from "./utils/ext";

function onRequest(request, _sender, sendResponse) {
    if (request.type === 'getWorkspaces') {
        let workspaces = [...document.querySelectorAll("a.cta_lead")].map(el => {
            //loginUrl only works for 24h
            return {
                name: el.querySelector("span.link_head").textContent,
                loginUrl: el.href,
                url: `https://${el.querySelector("span.cta_subdomain").textContent}`,
                image: el.querySelector("i.team_icon").style.backgroundImage.slice(4, -1).replace(/"/g, ""),
                lastUpdated: Date.now()
            }
        })
        sendResponse(workspaces)
    }
}

ext.runtime.onMessage.addListener(onRequest);