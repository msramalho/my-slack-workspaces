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
        return `<li data-json="${btoa(JSON.stringify(ws))}"><div class="dragzone"><img src="icons/drag-48.png"/></div><a class="href" href="${ws.url}"><span><img class="workspaceIcon"src="${ws.image}"/></span> <span class="content" alt="${ws.name}">${ws.name}</span></span></a><a class="removeWorkspace" removeName="${ws.name}" href="#"><span>x</span></a></li>`
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
            e.preventDefault();
            chrome.tabs.create({
                url: e.target.closest("a.href").href
            });
        }, false);
    });
    new draggable("#workspaces", readAndSaveWorkspaces);
    document.querySelectorAll("a.removeWorkspace").forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();

            let removeName = e.target.closest("a.removeWorkspace").getAttribute("removeName")
            storage.get('workspaces', (res) => {
                let workspaces = res.workspaces;
                if (!workspaces) return
                storage.set({
                    "workspaces": workspaces.filter(ws => ws.name != removeName)
                })
                e.target.closest("li").remove()
            });
        }, false);
    });
}

// event handler for drop of reordering
function readAndSaveWorkspaces() {
    let workspaces = [...document.querySelectorAll("#workspaces li")].map(el => JSON.parse(atob(el.getAttribute("data-json"))))
    storage.set({
        "workspaces": workspaces
    })
}

function keepWorkspacesOrder(workspaces, callback) {
    storage.get('workspaces', (res) => {
        let prev = res.workspaces;
        // nothing was previously saved
        if (!prev) return callback(workspaces)
        // something had been saved before -> add new to top
        let novel = workspaces.filter(ws => !prev.map(ws => ws.name).includes(ws.name))
        let old = prev.filter(ws => workspaces.map(ws => ws.name).includes(ws.name)) // preserve order
        callback(novel.concat(old))
    });
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
                keepWorkspacesOrder(workspaces, (finalWorkspaces) => {
                    storage.set({
                        "workspaces": finalWorkspaces
                    })
                    ext.notifications.create({
                        "type": "basic",
                        "iconUrl": ext.extension.getURL("icons/icon-32.png"),
                        "title": "Workspaces updated!",
                        "message": `Found ${finalWorkspaces.length} workspace${finalWorkspaces.length!=1?"s":""}`
                    });
                    renderWorkspaces(finalWorkspaces);
                    addHrefListeners();
                    // window.close(); // if the popup should be closed
                })
            } else {
                renderMessage("Unable to load workspaces, please retry")
            }
        });
    });
})