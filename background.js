console.log("background.js loaded");
browser.runtime.onMessage.addListener((message) => {
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    browser.tabs.sendMessage(activeTab.id, { response: `background message received.` });

    function onExecuted(result) {
      console.log(`onExecuted result: ${result}`); 
    }
    function onError(error) {
      console.log(`Error: ${error}`);
    }
    const scScript = `console.log("scScript running...");`
    var executing = browser.tabs.executeScript(activeTab.id, {
      code: scScript
    });
    executing.then(onExecuted, onError);
  });
});

