function openReport(){
    chrome.tabs.create({url: chrome.extension.getURL('html/report.html')});    
}

function toggleButtons(start){
    document.getElementById("import").style.display = start? "inline-block":"none"
    document.getElementById("start").style.display = start? "inline-block":"none"
    document.getElementById("pcontent").style.display = start? "block":"none"
    document.getElementById("cbuttons").style.display = start? "block":"none"
    document.getElementById("finish").style.display = start? "none":"inline-block"
    document.getElementById("state").style.display = start? "none":"inline-block"
}
function getRow(event){
    let value = event.type==="click"?`"x:${event.x} y:${event.y} "` : event.value.replace(/Enter/g, "[ENTER]")
    return `<tr><td>${event.site?event.site:""}</td><td>${event.type}</td><td>${value}</td></tr>`
}
/*
function getContent(events){
    toggleButtons(true)
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events));
    var dlAnchorElem = document.getElementById('export');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "result.json");

    return events.map(event=> getRow(event)).join('')
}
*/
const initPopupScript = () => {

    document.getElementById("import").addEventListener('click', openReport)
    document.getElementById("download").addEventListener('click', ()=>{
        document.getElementById('export').click()
    })

    chrome.runtime.sendMessage({type:"getState"},function(response){
        console.log("first response in popup")
        console.log(response)
        if(response.state == "record"){
            toggleButtons(false)
        }
    })


    document.getElementById("start").addEventListener("click", function(){
        chrome.runtime.sendMessage({type:"start"})
        toggleButtons(false)    
    })
    document.getElementById("finish").addEventListener("click", function(){
        chrome.runtime.sendMessage({type:"stop"})
        openReport()
        /*function(response){
            console.log('got response to stop request:')
            console.log(response)
            document.getElementById("contentbody").innerHTML = getContent(response.events)
        }); */
    })
}
document.addEventListener('DOMContentLoaded', initPopupScript)
