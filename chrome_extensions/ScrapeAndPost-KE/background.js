// service worker will not have access to the DOM but runs in the
// background
// Check if the page is the hnj page and if so send message to the DOM

// Allow the content script to manage the chrome session storage
chrome.storage.session.setAccessLevel({
  accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (tab.url && tab.url.includes("myjobmag.co.ke/job/")) {
      chrome.tabs.sendMessage(tabId, {
        type: "SCRAPE",
        data: tabId,
      });
    }
    if (
      tab.url &&
      tab.url.includes("manage.fuzu.com/campaigns") &&
      tab.url.includes("/steps/type")
    ) {
      chrome.tabs.sendMessage(tabId, {
        type: "FILLEC",
        data: tabId,
      });
    }
    if (
      tab.url &&
      tab.url.includes("manage.fuzu.com/campaigns") &&
      tab.url.includes("steps/one?created_from_template=true")
    ) {
      (async () => {
        jobObj = await chrome.storage.session.get(`${tabId}`);
        job = jobObj[tabId];
        if (job) {
          chrome.tabs.sendMessage(tabId, {
            type: "FILLJOBDETAILS",
            data: tabId,
            job: job,
          });
        }
      })();
    }
    if (
      tab.url &&
      tab.url.includes("manage.fuzu.com/campaigns") &&
      tab.url.includes("/steps/prescreening")
    ) {
      (async () => {
        chrome.tabs.sendMessage(tabId, {
          type: "PS_NEXT",
          data: tabId,
        });
      })();
    }
    if (
      tab.url &&
      tab.url.includes("manage.fuzu.com/campaigns") &&
      tab.url.includes("/steps/preview")
    ) {
      (async () => {
        await chrome.storage.session.remove(`${tabId}`);
        chrome.tabs.sendMessage(tabId, {
          type: "APPROVE",
          data: tabId,
        });
      })();
    }
    if (
      tab.url &&
      tab.url.includes("manage.fuzu.com/campaigns") &&
      tab.url.includes("/select_new_from_template")
    ) {
      (async () => {
        console.log(tabId);
        jobObj = await chrome.storage.session.get(`${tabId}`);
        job = jobObj[tabId];
        if (Object.keys(jobObj).length > 0) {
          jobObj[tabId]["counter"] += 1;
          await chrome.storage.session.set(jobObj);
        }
        chrome.tabs.sendMessage(tabId, {
          type: "ADDSEARCHBOX",
          data: tabId,
          job: job?.["jobTitle"],
        });
      })();
    }
    if (
      tab.url &&
      tab.url.includes("manage.fuzu.com/campaigns") &&
      tab.url.includes("/steps/two")
    ) {
      (async () => {
        jobObj = await chrome.storage.session.get(`${tabId}`);
        if (Object.keys(jobObj).length > 0) {
          const job = [jobObj[tabId]["jobTitle"]];
          job.push(jobObj[tabId]["level"]);
          job.push(jobObj[tabId]["approve"]);
          chrome.tabs.sendMessage(tabId, {
            type: "ADDJOBBOX",
            data: tabId,
            job: job,
          });
        }
      })();
    }
    if (tab.url && tab.url.includes("manage.fuzu.com/employers/campaign_for")) {
      (async () => {
        console.log(tabId);
        const savedTabDetails = await chrome.storage.session.get(
          String(tab.id)
        );
        chrome.tabs.sendMessage(tabId, {
          type: "FILLEMPLOYER",
          data: savedTabDetails?.[tab.id]?.employerId,
          employer: savedTabDetails?.[tab.id]?.employer,
          counter: savedTabDetails?.[tab.id]?.counter,
        });
      })();
    }
  }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "NEWJOB") {
    console.log(request)
    const job = await chrome.storage.session.get(`${request.tabId}`);
    console.log(job)
    if (Object.keys(job).length > 0) {
      const link = job[`${request.tabId}`]["applicationLink"]
      if (link.includes("myjobmag")) {
        await chrome.tabs.update(request.tabId, {
          url: link,
        });
        chrome.tabs.onUpdated.addListener(async function listener(tabId, changeInfo, tab) {
          if (tabId === request.tabId && changeInfo.status === "complete") {
            // Remove the listener after the tab has loaded
            chrome.tabs.onUpdated.removeListener(listener);
            console.log(tabId)
            console.log(tab.url)
            job[`${request.tabId}`]["applicationLink"] = tab.url
            await chrome.storage.session.set(job);
            // Now, go to FUZU
            await chrome.tabs.update(request.tabId, {
              url: "https://manage.fuzu.com/employers/campaign_for",
            });
          }});
        // job[`${request.tabId}`]["applicationLink"] = tabId.url
      } else {
        await chrome.tabs.update(request.tabId, {
          url: "https://manage.fuzu.com/employers/campaign_for",
        });
      }
    }
    // await chrome.tabs.update(request.tabId, {
    //   url: "https://manage.fuzu.com/employers/campaign_for",
    // });
  }
  if (request.action === "DUPLICATE") {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === request.data && changeInfo.status === "complete") {
        // Remove the listener after the tab has loaded
        chrome.tabs.onUpdated.removeListener(listener);
        // Now, send the FILLEMPLOYER message
        chrome.tabs.sendMessage(tabId, {
          type: "DUPLICATE",
          data: tabId,
        });
      }
    });
  }
});
