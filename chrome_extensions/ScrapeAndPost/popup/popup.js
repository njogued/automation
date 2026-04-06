document
  .getElementById("searchCompany")
  .addEventListener("click", async function (event) {
    event.preventDefault();
    const companyName = document.getElementById("companyName").value;
    const employersDict = await chrome.storage.local.get("employers");
    const employerId = employersDict.employers[companyName];
    if (employerId === undefined) {
      document.getElementById("companyId").value = "null";
    } else {
      document.getElementById("companyId").value = employerId;
    }
  });

document
  .getElementById("updateCompany")
  .addEventListener("click", async function (event) {
    event.preventDefault();
    const newCompanyName = document.getElementById("newCompanyName").value;
    const newCompanyId = document.getElementById("newCompanyId").value;
    async function update() {
      const employers = await chrome.storage.local.get("employers");
      let employersDict = employers.employers;
      employersDict[newCompanyName] = newCompanyId;
      chrome.storage.local.set({ employers: employersDict });
    }
    update(newCompanyName, newCompanyId);
    document.getElementById("newCompanyName").value = "";
    document.getElementById("newCompanyId").value = "";
    alert(`Company ${newCompanyName} updated with ID: ${newCompanyId}`);
  });

document
  .getElementById("clearDataButton")
  .addEventListener("click", async function () {
    await chrome.storage.session.clear();
    alert("Session storage cleared");
  });

// Use this function in the popup to download employer data as JSON

// document
//   .getElementById("saveDataButton")
//   .addEventListener("click", function () {
//     chrome.storage.local.get("employers").then((result) => {
//       let rs = JSON.stringify(result, null, 2);
//       let blob = new Blob([rs], { type: "application/json" });
//       var downloadLink = document.createElement("a");
//       downloadLink.href = URL.createObjectURL(blob);
//       downloadLink.download = "employers_data.json";
//       downloadLink.click();
//     });
//   });

// document
//   .getElementById("loadDataButton")
//   .addEventListener("click", function () {
//     // Function to read a local JSON file
//     function readLocalFile(file, callback) {
//       var rawFile = new XMLHttpRequest();
//       rawFile.overrideMimeType("application/json");
//       rawFile.open("GET", file, true);
//       rawFile.onreadystatechange = function () {
//         if (rawFile.readyState === 4 && rawFile.status == "200") {
//           callback(rawFile.responseText);
//         }
//       };
//       rawFile.send(null);
//     }

//     // Read the local JSON file
//     readLocalFile("../utils/employers_data.json", function (data) {
//       // Parse the JSON data
//       var jsonData = JSON.parse(data);

//       // Save data to local storage
//       chrome.storage.local.set(
//         { employers: jsonData["employers"] },
//         function () {
//           console.log("Data is set");
//         }
//       );
//       chrome.storage.local.get("employers").then((result) => {
//         console.log(result);
//       });
//     });
//   });
