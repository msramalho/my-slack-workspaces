import ext from "./utils/ext";

function onRequest(request, _sender, sendResponse) {
    if (request.type === 'getWorkspaces') {
        console.log(document.querySelectorAll("a.cta_lead"));
        let workspaces = [...document.querySelectorAll("a.cta_lead")].map(el => {
            return {
                name: el.querySelector("span.link_head").textContent,
                url: el.href,
                image: el.querySelector("i.team_icon").style.backgroundImage.slice(4, -1).replace(/"/g, ""),
            }
        })
        sendResponse(workspaces)
    }
}

ext.runtime.onMessage.addListener(onRequest);