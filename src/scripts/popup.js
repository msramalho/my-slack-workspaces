import ext from "./utils/ext";
import storage from "./utils/storage";
import draggable from "./utils/draggable";


//globals
const WORKSPACES_PAGE = "https://slack.com/your-workspaces"

// body of the popup that will hold displayable data
let body = document.getElementById("display-container");

// on load check storage for saved workspaces
storage.get('workspaces', (res) => {
    let workspaces = res.workspaces;
    if (!workspaces) {
        renderMessage("No workspaces found.");
    } else {
        renderWorkspaces(workspaces)
    }
    addHrefListeners();
});

// build html to display the workspaces
function renderWorkspaces(workspaces) {
    let items = workspaces.map(ws => {
        return `<li data-json="${btoa(JSON.stringify(ws))}"><div class="dragzone"><img src="icons/drag-48.png"/></div><a class="href" href="${ws.url}"><span><img class="workspaceIcon"src="${ws.image}"/></span> <span class="content" alt="${ws.name}">${ws.name}</span></span></li>`
    }).join("")
    body.innerHTML = `<ul id="workspaces">${items}</ul>`;
}

var renderMessage = (message) => {
    body.innerHTML = `<p class='message'>${message}</p>`;
}


// display the update link if the page is the correct one
let instructionsItem = document.querySelector("#update-link")
ext.tabs.query({
    active: true,
    currentWindow: true
}, function(tabs) {
    instructionsItem.style.display = "none";
    if (tabs.filter(t => t.url.includes(WORKSPACES_PAGE)).length) instructionsItem.style.display = "list-item";
});

// add the listeners to the href
function addHrefListeners() {
    document.querySelectorAll("a.href").forEach(el => {
        el.addEventListener('click', (e) => {
            chrome.tabs.create({
                url: e.target.closest("a.href").href
            });
        }, false);
    });
    new draggable("#workspaces", readAndSaveWorkspaces);
}

// event handler for drop of reordering
function readAndSaveWorkspaces() {
    let workspaces = [...document.querySelectorAll("#workspaces li")].map(el => JSON.parse(atob(el.getAttribute("data-json"))))
    storage.set({
        "workspaces": workspaces
    })
}

// handler for click on the special "update" button
let updateLink = document.querySelector(".update-workspaces");
updateLink.addEventListener("click", function(e) {
    ext.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        ext.tabs.sendMessage(tabs[0].id, {
            type: "getWorkspaces"
        }, (workspaces) => {
            if (workspaces) {
                storage.set({
                    "workspaces": workspaces
                })
                ext.notifications.create({
                    "type": "basic",
                    "iconUrl": ext.extension.getURL("icons/icon-32.png"),
                    "title": "Workspaces updated!",
                    "message": `Found ${workspaces.length} workspace${workspaces.length!=1?"s":""}`
                });
                renderWorkspaces(workspaces);
                addHrefListeners();
                // window.close(); // if the popup should be closed
            } else {
                renderMessage("Unable to load workspaces, please retry")
            }
        });
    });
})