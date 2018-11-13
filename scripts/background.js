chrome.runtime.onInstalled.addListener(function(info){
    console.log('on installed', arguments);
    // info.reason
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){

    function showSpottingIcon(newSpotting){
        chrome.pageAction.setIcon({
            tabId: sender.tab.id,
            path:  newSpotting ? '/icons/new-meteor.png' : '/icons/meteor.png'
        });


        chrome.pageAction.setPopup({
            tabId: sender.tab.id,
            popup:  newSpotting ? '/popups/new-spotting.html' : '/popups/spotting.html'
        });

        chrome.pageAction.show(sender.tab.id);
    }

    if(typeof message.report !== 'undefined'){
        console.log('got a report', message.report, 'from', message.from);

        var foundMeteorTraces = false; 

        for(var i=0; i<message.report.length; i++){
            var content = message.report[i].content;
            if(content.indexOf("__meteor_runtime_config__") !== -1){
                foundMeteorTraces = true;
                break;
            }
        }

        if(foundMeteorTraces){

            showSpottingIcon(true);

            sendResponse({});

        } 
    }

    return true;
});