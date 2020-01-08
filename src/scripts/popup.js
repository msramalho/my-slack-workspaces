import ext from "./utils/ext";
import storage from "./utils/storage";

let instructionsItem = document.querySelector("#update-link")

// var popup = document.getElementById("app");
storage.get('workspaces', function(resp) {
    let workspaces = resp.workspaces;
    if (!workspaces) {
        renderMessage("No workspaces found.");
    }
});

var template = (data) => {
    var json = JSON.stringify(data);
    return (`
  <div class="site-description">
    <h3 class="title">${data.title}</h3>
    <p class="description">${data.description}</p>
    <a href="${data.url}" target="_blank" class="url">${data.url}</a>
  </div>
  <div class="action-container">
    <button data-bookmark='${json}' id="save-btn" class="btn btn-primary">Save</button>
  </div>
  `);
}
var renderMessage = (message) => {
    var displayContainer = document.getElementById("display-container");
    displayContainer.innerHTML = `<p class='message'>${message}</p>`;
}
var tab;
var renderBookmark = (data) => {
    var displayContainer = document.getElementById("display-container")
    if (data) {
        var tmpl = template(data);
        displayContainer.innerHTML = tmpl;
    } else {
        console.log(tab);
        renderMessage(JSON.stringify(tab.url))
    }
}

ext.tabs.query({
    active: true,
    currentWindow: true
}, function(tabs) {
    instructionsItem.style.display = "none";
    let filtered = tabs.filter(t => t.url.includes("https://slack.com/your-workspaces"))
    if (filtered.length){
        instructionsItem.style.display = "list-item";
        let tab = filtered[0];
        chrome.tabs.sendMessage(tab.id, {
            action: 'process-page'
        }, renderBookmark);
    }
});


let workspaceLink = document.querySelector(".slack-workspaces");
workspaceLink.addEventListener("click", function(e) {
    e.preventDefault();
    ext.tabs.create({
        'url': "https://slack.com/your-workspaces"
    });
})