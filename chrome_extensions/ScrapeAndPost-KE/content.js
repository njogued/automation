chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const { type, data, job, employer, counter } = obj;

  const postFunction = (jobDetails, tabId) => {
    chrome.runtime.sendMessage({
      action: "NEWJOB",
      data: jobDetails,
      tabId: tabId,
    });
  };

  // Function to create the job on HNJ
  const createFormFunction = () => {
    const form = document.createElement("form");
    form.id = "jobForm";
    form.innerHTML = `
      <div class="gridDiv">
      <div class="gridCol">
        <label>Employer</label><input type="text" name="employer" id="employer" />
      </div>
      <div class="gridCol">
        <label>Location</label
        ><select name="location" id="location">
          <option value="1" style="display: block;">Nairobi, Kenya</option>
          <option value="2" style="display: block;">Mombasa, Kenya</option>
          <option value="3" style="display: block;">Kisumu, Kenya</option>
          <option value="15" style="display: block;">Athi River, Kenya</option>
          <option value="363" style="display: block;">Baringo, Kenya</option>
          <option value="359" style="display: block;">Bomet, Kenya</option>
          <option value="276" style="display: block;">Bungoma, Kenya</option>
          <option value="375" style="display: block;">Busia, Kenya</option>
          <option value="391" style="display: block;">Chogoria, Kenya</option>
          <option value="367" style="display: block;">Daadab, Kenya</option>
          <option value="5" style="display: block;">Eldoret, Kenya</option>
          <option value="274" style="display: block;">Embu, Kenya</option>
          <option value="19" style="display: block;">Garissa, Kenya</option>
          <option value="379" style="display: block;">Homa Bay, Kenya</option>
          <option value="380" style="display: block;">Homa Bay, Kenya</option>
          <option value="393" style="display: block;">Isiolo, Kenya</option>
          <option value="360" style="display: block;">Kajiado, Kenya</option>
          <option value="370" style="display: block;">Kakamega, Kenya</option>
          <option value="366" style="display: block;">Kakuma, Kenya</option>
          <option value="9" style="display: block;">Kangundo, Kenya</option>
          <option value="390" style="display: block;">Kapenguria, Kenya</option>
          <option value="16" style="display: block;">Karuri, Kenya</option>
          <option value="138" style="display: block;">Kenya</option>
          <option value="6" style="display: block;">Kehancha, Kenya</option>
          <option value="358" style="display: block;">Kericho, Kenya</option>
          <option value="364" style="display: block;">Kiambu, Kenya</option>
          <option value="397" style="display: block;">Kibwezi, Kenya</option>
          <option value="350" style="display: block;">Kigali, Kenya</option>
          <option value="8" style="display: block;">Kikuyu, Kenya</option>
          <option value="18" style="display: block;">Kilifi, Kenya</option>
          <option value="373" style="display: block;">Kirinyaga, Kenya</option>
          <option value="275" style="display: block;">Kisii, Kenya</option>
          <option value="361" style="display: block;">Kitale, Kenya</option>
          <option value="12" style="display: block;">Kitui, Kenya</option>
          <option value="383" style="display: block;">Kwale, Kenya</option>
          <option value="392" style="display: block;">Laikipia, Kenya</option>
          <option value="388" style="display: block;">Lamu, Kenya</option>
          <option value="346" style="display: block;">Limuru, Kenya</option>
          <option value="384" style="display: block;">Lodwar, Kenya</option>
          <option value="347" style="display: block;">Maasai Mara, Kenya</option>
          <option value="13" style="display: block;">Machakos, Kenya</option>
          <option value="385" style="display: block;">Magadi, Kenya</option>
          <option value="396" style="display: block;">Makueni, Kenya</option>
          <option value="10" style="display: block;">Malindi, Kenya</option>
          <option value="382" style="display: block;">Mandera, Kenya</option>
          <option value="389" style="display: block;">Marsabit, Kenya</option>
          <option value="368" style="display: block;">Meru, Kenya</option>
          <option value="378" style="display: block;">Migori, Kenya</option>
          <option value="371" style="display: block;">Muranga, Kenya</option>
          <option value="11" style="display: block;">Naivasha, Kenya</option>
          <option value="4" style="display: block;">Nakuru, Kenya</option>
          <option value="356" style="display: block;">Nandi, Kenya</option>
          <option value="362" style="display: block;">Nandi, Kenya</option>
          <option value="277" style="display: block;">Nanyuki, Kenya</option>
          <option value="357" style="display: block;">Narok, Kenya</option>
          <option value="395" style="display: block;">Nyandarua, Kenya</option>
          <option value="17" style="display: block;">Nyeri, Kenya</option>
          <option value="369" style="display: block;">Oyugis, Kenya</option>
          <option value="7" style="display: block;">Ruiru, Kenya</option>
          <option value="353" style="display: block;">Rumuruti, Kenya</option>
          <option value="352" style="display: block;">Samburu, Kenya</option>
          <option value="381" style="display: block;">Siaya, Kenya</option>
          <option value="386" style="display: block;">Taveta, Kenya</option>
          <option value="394" style="display: block;">Tana River, Kenya</option>
          <option value="377" style="display: block;">Tharaka Nithi, Kenya</option>
          <option value="14" style="display: block;">Thika, Kenya</option>
          <option value="372" style="display: block;">Trans Nzoia, Kenya</option>
          <option value="354" style="display: block;">Turkana, Kenya</option>
          <option value="374" style="display: block;">Uasin Gishu, Kenya</option>
          <option value="20" style="display: block;">Vihiga, Kenya</option>
          <option value="387" style="display: block;">Wajir, Kenya</option>
          <option value="365" style="display: block;">Zanzibar, Kenya</option>
        </select>
      </div>
    </div>
    <div class="gridDiv">
      <div class="gridCol">
        <label>Job Title</label
        ><input type="text" name="jobTitle" id="jobTitle" />
      </div>
      <div class="gridCol">
        <label>Job Type</label
        ><select name="jobType" id="jobType">
          <option value="permanent">Permanent</option>
          <option value="fixed_term">Fixed Term</option>
          <option value="temporary">Temporary</option>
        </select>
      </div>
    </div>
    <div class="gridDiv">
      <div class="gridCol">
        <label>Job Category</label
        ><select name="jobCategory" id="jobCategory">
          <option value="Invalid">----</option>
          <option value="1">Accounting, finance, banking, insurance</option>
          <option value="2">Administrative, clerical</option>
          <option value="3">Agriculture, fishing, forestry, wildlife</option>
          <option value="4">Business, strategic management</option>
          <option value="6">Construction</option>
          <option value="7">Customer support, client care</option>
          <option value="8">Design, arts</option>
          <option value="29">Electrical engineering</option>
          <option value="28">Energy, power</option>
          <option value="9">Engineering, architecture</option>
          <option value="10">Entertainment</option>
          <option value="32">Food, nutrition</option>
          <option value="27">General management, leadership</option>
          <option value="31">Government, community development, public services</option>
          <option value="12">Human resources</option>
          <option value="5">Information technology, software development, data</option>
          <option value="13">Installation, maintenance, repair</option>
          <option value="14">Legal</option>
          <option value="15">Manufacturing, operations, quality</option>
          <option value="30">Mechanical engineering</option>
          <option value="16">Media, communications, languages</option>
          <option value="17">Medical, health</option>
          <option value="18">Project, program management</option>
          <option value="19">Research, academy</option>
          <option value="20">Restaurant, hospitality, travel</option>
          <option value="21">Sales, marketing, promotion</option>
          <option value="22">Security</option>
          <option value="23">Skilled, manual labor</option>
          <option value="11">Sports, beauty, wellbeing</option>
          <option value="24">Teaching, training</option>
          <option value="26">Transportation, logistics, driving</option>
          <option value="25">Telecommunications</option>
        </select>
      </div>
      <div class="gridCol">
        <label>Industry</label
        ><select name="industry" id="industry">
        <option value="Invalid">----</option>
        <option value="32">Aeronautics</option>
        <option value="1">Agriculture, fishing, forestry</option>
        <option value="2">Arts, design</option>
        <option value="34">Automotive</option>
        <option value="3">Banking, microfinance, insurance</option>
        <option value="4">Beauty, cosmetics</option>
        <option value="29">Communications, media, radio, tv</option>
        <option value="5">Computers, software development and services</option>
        <option value="6">Construction, renovation, maintenance</option>
        <option value="30">Consulting, business support, auditing</option>
        <option value="70">Data/Research</option>
        <option value="7">Education, academic</option>
        <option value="8">Electronics</option>
        <option value="9">Energy, utilities, environment</option>
        <option value="10">Engineering, architecture</option>
        <option value="11">Entertainment, events</option>
        <option value="103">Finance &amp; FinTech</option>
        <option value="37">Financial Services</option>
        <option value="35">Fitness, well-being and lifestyle</option>
        <option value="12">Governmental</option>
        <option value="13">Handicraft</option>
        <option value="14">Health care, medical</option>
        <option value="15">Housekeeping, maintenance</option>
        <option value="33">Human resources, talent development, recruiting</option>
        <option value="31">Import, export</option>
        <option value="16">Legal, accounting</option>
        <option value="17">Manufacturing</option>
        <option value="18">Marketing, advertising</option>
        <option value="19">Non-profit, social work</option>
        <option value="20">Outsourcing, leasing</option>
        <option value="21">Raw materials, oil, chemicals</option>
        <option value="22">Real estate</option>
        <option value="23">Restaurant, hospitality, travel</option>
        <option value="24">Retail, wholesale, FMCG</option>
        <option value="25">Security</option>
        <option value="26">Telecommunications</option>
        <option value="27">Textile, fashion</option>
        <option value="28">Transportation, logistics, storage</option>
        </select>
      </div>
    </div>
    <div>
      <label>Job Summary</label>
      <div class="editableDivs" id="jobSummary" contenteditable="true">
        <br />
      </div>
    </div>
    <div>
      <label>Responsibilities</label>
      <div
        class="editableDivs"
        id="responsibilities"
        contenteditable="true"
      ></div>
    </div>
    <div class="gridDiv">
      <div class="gridCol">
        <label>Education Level</label
        ><select name="education" id="education">
          <option value="Invalid">----</option>
          <option value="5">Bachelor's degree</option>
          <option value="6">Post-graduate education</option>
          <option value="4">Diploma, Associate's degree</option>
          <option value="3">Vocational school</option>
          <option value="2">High, secondary school</option>
          <option value="1">Primary school</option>
        </select>
      </div>
      <div class="gridCol">
        <label>Job Level</label
        ><select name="jobLevel" id="jobLevel">
          <option value="Invalid">----</option>
          <option value="3">Experienced (senior worker)</option>
          <option value="4">Expert (non-managerial)</option>
          <option value="5">Manager (team leader)</option>
          <option value="6">Senior manager (department head)</option>
          <option value="7">Executive (director)</option>
          <option value="2">Basic level (worker)</option>
          <option value="1">Intern or trainee</option>
        </select>
      </div>
    </div>
    <div class="gridDiv">
      <div class="gridCol">
        <label>Job Expiry</label
        ><input type="date" name="jobExpiry" id="jobExpiry" />
      </div>
      <div class="gridCol">
        <label>Years of Experience</label
        ><select name="experience" id="experience">
          <option value="Invalid">----</option>
          <option value="0">None</option>
          <option value="1">One Month</option>
          <option value="3">Three Months</option>
          <option value="6">6 Months</option>
          <option value="12">12 Months</option>
          <option value="18">18 Months</option>
          <option value="24">2 Years</option>
          <option value="36">3 Years</option>
          <option value="60">5 Years</option>
          <option value="84">7 Years</option>
          <option value="120">10 Years</option>
        </select>
      </div>
    </div>
    <label>Method of Application</label
    ><select name="applicationMethod" id="applicationMethod">
      <option value="email_application">email_application</option>
      <option value="outside">outside</option>
      <option value="postal">postal</option></select
    ><label>Application Link</label
    ><input
      type="text"
      name="applicationLink"
      id="applicationLink"
    /><label></label><input type="submit" name="submitButton" id="submitButton" value="Go to FUZU" />
    `;
    // Add styling dynamically
    const style = document.createElement("style");
    style.textContent = `
    #jobForm {
      background-color: #fff;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      padding: 12px 7px;
      width: 97%;
      border-top: solid lightslategrey;
      border-bottom: solid;
    }
  
    .gridDiv {
      display: grid;
      grid-template-columns: 60% auto;
    }
  
    .gridCol {
      width: 95%;
    }
  
    .editableDivs {
      border: 2px solid #000000;
      min-height: 50px;
      padding: 10px;
      max-height: 150px;
      overflow-y: auto;
    }
  
    label {
      display: block;
      margin-bottom: 8px;
    }
  
    input,
    textarea,
    select {
      width: 100%;
      padding: 5px;
      margin-bottom: 16px;
      box-sizing: border-box;
    }

    select {
      height: 35px;
      background-color: rgb(15 61 61);
      color: white;
      border-color: rgb(242 181 32 / 85%);
      border-radius: 3px;
    }
  
    input[type="submit"] {
      background-color: #4caf50;
      color: #fff;
      cursor: pointer;
    }
  
    input[type="submit"]:hover {
      background-color: #45a049;
    }
  `;
    document.head.appendChild(style);
    return form;
  };

  // Function to fetch info
  const fetchInfo = (data) => {
    const locationsDict = {
      "Athi River, Kenya": "15",
      "Baringo, Kenya": "363",
      "Bomet, Kenya": "359",
      "Bungoma, Kenya": "276",
      "Busia, Kenya": "375",
      "Chogoria, Kenya": "391",
      "Daadab, Kenya": "367",
      "Dar es Salaam, Kenya": "349",
      "Eldoret, Kenya": "5",
      "Embu, Kenya": "274",
      "Garissa, Kenya": "19",
      "Homa Bay, Kenya": "380",
      "Isiolo, Kenya": "393",
      "Kajiado, Kenya": "360",
      "Kakamega, Kenya": "370",
      "Kakuma, Kenya": "366",
      "Kangundo, Kenya": "9",
      "Kapenguria, Kenya": "390",
      "Karuri, Kenya": "16",
      Kenya: "138",
      "Kehancha, Kenya": "6",
      "Kericho, Kenya": "358",
      "Kiambu, Kenya": "364",
      "Kibwezi, Kenya": "397",
      "Kigali, Kenya": "350",
      "Kikuyu, Kenya": "8",
      "Kilifi, Kenya": "18",
      "Kirinyaga, Kenya": "373",
      "Kisii, Kenya": "275",
      "Kisumu, Kenya": "3",
      "Kitale, Kenya": "361",
      "Kitui, Kenya": "12",
      "Kwale, Kenya": "383",
      "Laikipia, Kenya": "392",
      "Lamu, Kenya": "388",
      "Limuru, Kenya": "346",
      "Lodwar, Kenya": "384",
      "Maasai Mara, Kenya": "347",
      "Machakos, Kenya": "13",
      "Magadi, Kenya": "385",
      "Makueni, Kenya": "396",
      "Malindi, Kenya": "10",
      "Mandera, Kenya": "382",
      "Marsabit, Kenya": "389",
      "Meru, Kenya": "368",
      "Migori, Kenya": "378",
      "Mombasa, Kenya": "2",
      "Muranga, Kenya": "371",
      "Nairobi, Kenya": "1",
      "Naivasha, Kenya": "11",
      "Nakuru, Kenya": "4",
      "Nandi, Kenya": "362",
      "Nanyuki, Kenya": "277",
      "Narok, Kenya": "357",
      "Nyandarua, Kenya": "395",
      "Nyeri, Kenya": "17",
      "Oyugis, Kenya": "369",
      "Ruiru, Kenya": "7",
      "Rumuruti, Kenya": "353",
      "Samburu, Kenya": "352",
      "Siaya, Kenya": "381",
      "Taveta, Kenya": "386",
      "Tana River, Kenya": "394",
      "Tharaka Nithi, Kenya": "377",
      "Thika, Kenya": "14",
      "Trans Nzoia, Kenya": "372",
      "Turkana, Kenya": "354",
      "Uasin Gishu, Kenya": "374",
      "Vihiga, Kenya": "20",
      "Wajir, Kenya": "387",
      "Zanzibar, Kenya": "365",
    };

    function getLocationIfExists(searchKey) {
      // Check for a match with the searchKey as a substring
      for (let key in locationsDict) {
        if (key.includes(searchKey)) {
          return locationsDict[key];
        }
      }
      // If no match is found, return the value for the key "Kenya"
      return locationsDict["Nairobi, Kenya"];
    }

    // get job location
    const location = getLocationIfExists(
      document.getElementsByClassName("jkey-info")[3].innerText
    );
    document.getElementById("location").value = location;

    // get job exp
    const jobExp = document.getElementsByClassName("jkey-info")[2].innerText;
    yearsToMatch = { 4: "36", 6: "60", 8: "84", 10: "120" };
    if (jobExp != "") {
      if (jobExp.includes("ear") || jobExp.includes("ears")) {
        const expYears = jobExp.match(/\d+/)[0];
        if (expYears in yearsToMatch) {
          document.getElementById("experience").value = yearsToMatch[expYears];
        } else if (parseInt(expYears, 10) > 10) {
          document.getElementById("experience").value = "120";
        } else {
          document.getElementById("experience").value = (
            expYears * 12
          ).toString();
        }
      } else if (jobExp.includes("onth") || jobExp.includes("onths")) {
        const expMonths = jobExp.match(/\d+/)[0];
        document.getElementById("experience").value = expMonths;
      }
    }

    const job_type = document.getElementsByClassName("jkey-info")[0].innerText;
    if (job_type.includes("Contract")) {
      document.getElementById("jobType").value = "fixed_term";
    } else if (job_type.includes("Temporary")) {
      document.getElementById("jobType").value = "temporary";
    } else {
      document.getElementById("jobType").value = "permanent";
    }

    const jobDetailsDiv = document.querySelector(".job-details");
    const pTagsInMain = document
      .getElementsByClassName("job-details")[0]
      .querySelectorAll("p");
    // Get job details from job title line:
    var jobLine;
    const jobLines = document
      .getElementsByClassName("read-h1")[0]
      .innerText.split("\n");
    if (jobLines.length > 0 && jobLines[0].endsWith(".")) {
      jobLine = jobLines[0].slice(0, -1);
      document.getElementById("employer").value = jobLine
        .split(" at ")[1]
        .trim();
      document.getElementById("jobTitle").value = jobLine
        .split(" at ")[0]
        .trim();
    } else {
      jobLine = jobLines[0];
      document.getElementById("employer").value = jobLine
        .split(" at ")[1]
        .trim();
      document.getElementById("jobTitle").value = jobLine
        .split(" at ")[0]
        .trim();
    }

    // Get application method and value
    const apps = document.getElementsByClassName("mag-b bm-b-30");
    let app_link = apps[2].querySelector("a");
    let app_link_mail = "";
    let app_link_postal = "";
    if (app_link) {
      const app_link_web = app_link.href;
      document.getElementById("applicationMethod").value = "outside";
      document.getElementById("applicationLink").value = app_link_web;
    } else if (apps[2].innerText.includes("@")) {
      app_link_mail = apps[2].innerText.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      )[0];
      document.getElementById("applicationMethod").value = "email_application";
      document.getElementById("applicationLink").value = app_link_mail;
    } else {
      document.getElementById("applicationMethod").value = "postal";
      app_link_postal = apps[2].innerHTML;
    }

    // Get application closing date
    const expiry = document
      .getElementsByClassName("read-date-sec-li")[1]
      .innerText.split(": ")[1];
    if (expiry.includes("2024") || expiry.includes("2025")) {
      const cleanDate = expiry.replace(/(\d+)(st|nd|rd|th)/, "$1");
      const dateObj = new Date(cleanDate);
      document.getElementById("jobExpiry").value = `${dateObj
        .getFullYear()
        .toString()}-${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${dateObj.getDate().toString().padStart(2, "0")}`;
    } else {
      Date.prototype.addDays = function (days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
      };
      const now = new Date();
      const dateObj = now.addDays(15);
      document.getElementById("jobExpiry").value = `${dateObj
        .getFullYear()
        .toString()}-${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${dateObj.getDate().toString().padStart(2, "0")}`;
    }

    // get the qualifications and job description by slicing the last div
    // This will not work if the qualifications is not the last div but it usually is
    try {
      let app_method = "";
      if (app_link_mail != "" && app_link_mail.includes("@")) {
        app_method = document.getElementsByClassName("mag-b bm-b-30")[2].innerHTML.replace(app_link_mail, "the provided email address");
      } else if (app_link_postal != "") {
        app_method = document.getElementsByClassName("mag-b bm-b-30")[2].innerHTML;
      }
      const jobDetailsDiv = document.querySelector(".job-details");
      const pTagsInMain = document
        .getElementsByClassName("job-details")[0]
        .querySelectorAll("p");
      if (pTagsInMain.length > 1) {
        const jobDetailsHTML = jobDetailsDiv.innerHTML;
        // Add more titles as you find them
        // const regex = /(<p[^>]*>\s*<strong>\s*(Requirements|Qualifications|About You)\s*<\/strong>\s*<\/p>)/i;
        let found = false;
        let pTagHTML = "";

        for (const p of pTagsInMain) {
          strongTag = p.querySelector("strong");
          // Edit with more words as you find them
          if (
            strongTag &&
            /Qualification|Experience|Requirement|Skill|The Person|Education|What You’ll Bring|Knowledge|Who you are|About you/i.test(
              strongTag.textContent
            )
          ) {
            pTagHTML = strongTag.outerHTML;
            found = true;
            break; // Exit the loop once a match is found
          }
        }

        if (found) {
          const parts = jobDetailsHTML.split(pTagHTML);
          document.getElementById("jobSummary").innerHTML =
            pTagHTML + parts[parts.length - 1].trim() + app_method;
          document.getElementById("responsibilities").innerHTML =
            parts[0].trim();
        } else {
          document.getElementById(
            "jobSummary"
          ).innerHTML = `${jobDetailsHTML.trim()}${app_method}`;
        }
      } else {
        const jobDetailsHTML = jobDetailsDiv.innerHTML;
        document.getElementById(
          "jobSummary"
        ).innerHTML = `${jobDetailsHTML.trim()}${app_method}`;
      }
    } catch (error) {
      console.log(error);
      document.getElementById("jobSummary").innerHTML =
        document.querySelector(".job-details").innerHTML;
    }

    document
      .getElementById("submitButton")
      .addEventListener("click", async (event) => {
        event.preventDefault();

        currDate = document.getElementById("jobExpiry").value;
        formattedDate = `${currDate.split("-")[2]}/${currDate.split("-")[1]}/${
          currDate.split("-")[0]
        }`;
        const employersDict = await chrome.storage.local.get("employers");
        const employerId =
          employersDict["employers"][document.getElementById("employer").value];
        const locations = document.getElementById("location");
        const location_name = locations.options[locations.selectedIndex].text.split(',')[0]
        const jobDetails = {
          approve: false,
          tab: data,
          employer: document.getElementById("employer").value,
          employerId: employerId,
          counter: 0,
          contractType: document.getElementById("jobType").value,
          location: document.getElementById("location").value,
          location_name: location_name,
          jobTitle: document.getElementById("jobTitle").value,
          level: document.getElementById("jobLevel").value,
          education: document.getElementById("education").value,
          experience: document.getElementById("experience").value,
          jobCategory: document.getElementById("jobCategory").value,
          industry: document.getElementById("industry").value,
          jobSummary: document.getElementById("jobSummary").innerHTML,
          responsibilities:
            document.getElementById("responsibilities").innerHTML,
          jobExpiry: formattedDate,
          applicationMethod: document.getElementById("applicationMethod").value,
          applicationLink: document.getElementById("applicationLink").value,
        };
        await chrome.storage.session.set({ [data]: jobDetails });
        postFunction(jobDetails, data);
      });
  };

  // Function to create the scrape button on HNJ
  const scraperButtonFunction = (data) => {
    const scrapeButton = document.getElementById("scrape-button");
    if (!scrapeButton) {
      const scrapeButton = document.createElement("button");
      scrapeButton.id = "scrape-button";
      scrapeButton.innerText = "Click to Scrape";
      scrapeButton.style =
        "background-color: #4caf50; color: #fff; cursor: pointer;";
      // Scrape Button Event Listener
      scrapeButton.addEventListener("click", () => {
        jobForm = document.getElementById("jobForm");
        if (!jobForm) {
          const detailsForm = createFormFunction();
          scrapeButton.after(detailsForm);
          fetchInfo(data);
        }
      });
      const jobdiv = document.getElementsByClassName("job-description")[0];
      const pTags = jobdiv.getElementsByTagName("p");
      const lastPTag = pTags[pTags.length - 1];
      lastPTag.after(scrapeButton);
    }
  };

  // Update job level in the job stored in session
  const updateWithLevel = async (value, tabId) => {
    const options = {
      1: "Intern or trainee",
      2: "Basic level(worker)",
      3: "Experienced (senior worker)",
      4: "Expert (non-managerial)",
      5: "Manager (team leader)",
      6: "Senior manager (department head)",
      7: "Executive (director)",
    };
    const jobObjLevel = await chrome.storage.session.get(tabId.toString());
    jobObjLevel[tabId.toString()]["level"] = options[value];
    const updatedJob = await chrome.storage.session.set(jobObjLevel);
    return updatedJob;
  };

  // Function to create a search container on the duplicate page
  const createSearchContainer = (job, data) => {
    const styles = `
    .search-container {
        display: flex;
        gap: 10px;
        margin: 10px 20px;
        width: 90%;
        position: fixed;
        top: 60px;
        background: rgb(238, 238, 238);
        z-index: 1000;
    }

    #searchInput {
        flex: 1;
    }

    .newButtons { 
      border: 2px solid black;
      padding: 10px 30px;
      background-color: rgb(255, 225, 64);
      cursor: pointer; 
      color: black;
    }

    #approveContainer {
      display: flex;
      align-items: center;
    }

    input#approveCheck {
      margin: 0px 5px;
    }
    #approveCheckLabel {
      margin: 0;
    }`;
    const styleElement = document.createElement("style");
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    backButton = document.createElement("button");
    backButton.textContent = "Back";
    backButton.id = "backButton";
    backButton.classList.add("newButtons");

    const searchContainer = document.createElement("div");
    searchContainer.classList.add("search-container");

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "searchInput";
    searchInput.value = job;

    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy";
    copyButton.id = "copyButton";
    copyButton.classList.add("newButtons");

    const searchButton = document.createElement("button");
    searchButton.textContent = "Search";
    searchButton.id = "searchButton";
    searchButton.classList.add("newButtons");

    const approveCheckBox = document.createElement("div");
    const checkboxInput = document.createElement("input");
    checkboxInput.type = "checkbox";
    checkboxInput.id = "approveCheck";
    checkboxInput.name = "approveCheck";

    const labelForCheckbox = document.createElement("label");
    labelForCheckbox.id = "approveCheckLabel";
    labelForCheckbox.htmlFor = "approveCheck";
    labelForCheckbox.textContent = "Approve";

    // Append the input and label to the div container
    approveCheckBox.appendChild(checkboxInput);
    approveCheckBox.appendChild(labelForCheckbox);
    approveCheckBox.id = "approveContainer";
    approveCheckBox.classList.add("newButtons");

    backButton.addEventListener("click", function () {
      const currentUrl = window.location.href;
      window.location.replace(
        currentUrl.split("select")[0] + "steps/one?created_from_template=true"
      );
    });

    copyButton.addEventListener("click", function () {
      navigator.clipboard.writeText(searchInput.value);
    });

    searchButton.addEventListener("click", function () {
      const searchText = searchInput.value;
      if (searchText) {
        window.find(searchText, false, false, true);
      }
    });

    checkboxInput.addEventListener("click", async function () {
      if (document.getElementById("approveCheck").checked === true) {
        const jobObj = await chrome.storage.session.get(`${data}`);
        if (Object.keys(jobObj).length > 0) {
          jobObj[`${data}`]["approve"] = true;
          await chrome.storage.session.set(jobObj);
        }
      } else {
        const jobObj = await chrome.storage.session.get(`${data}`);
        if (Object.keys(jobObj).length > 0) {
          jobObj[`${data}`]["approve"] = false;
          await chrome.storage.session.set(jobObj);
        }
      }
    });

    // Append elements to the container
    searchContainer.appendChild(backButton);
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(copyButton);
    searchContainer.appendChild(searchButton);
    searchContainer.appendChild(approveCheckBox);

    const parentDiv = document.getElementsByClassName("fz-page-wrapper")[0];
    parentDiv.prepend(searchContainer);
    // const header = document.getElementsByClassName("row")[0];
    // header.after(searchContainer);
  };

    // Function to fill in Job Details
    const fillJobDetails = async (job) => {
      try {
        let next_counter = 0;
        document.getElementById("campaign_creation_step_one_title").value =
          job["jobTitle"];
        // document.getElementById("campaign_creation_step_one_job_type").value = "full_time"
        document.getElementById(
          "description_editor"
        ).contentDocument.body.innerHTML = `<div>${job["jobSummary"]
          .replace(/<p\s?\/?>\s?<\/p\s?\/?>/g, "")
          .replace(/\n/g, "")}</div>`;
        document.getElementById(
          "responsibility_text_editor"
        ).contentDocument.body.innerHTML = `<div>${job["responsibilities"]
          .replace(/<p\s?\/?>\s?<\/p\s?\/?>/g, "")
          .replace(/\n/g, "")}</div>`;
        // Set country to Kenya
        document.getElementById(
          "campaign_creation_step_one_fuzu_country_id"
        ).value = "1";
        if (document.getElementById("campaign_creation_step_one_location_id")) {
          document.getElementById(
            "campaign_creation_step_one_location_id"
          ).value = job["location"];
          next_counter = 1; // 1
        } else {
          if (
            document.getElementById("campaign_creation_step_one_custom_location")
          ) {
            document.getElementById(
              "campaign_creation_step_one_custom_location"
            ).value = job["location_name"];
            next_counter = 1; // 1
          }
        }
        if (job["experience"] != null && job["experience"] != "Invalid") {
          document.getElementById(
            "campaign_creation_step_one_required_work_experience_months"
          ).value = job["experience"];
          next_counter += 1; // 2
        }
        if (job["level"] != null && job["level"] != "Invalid") {
          document.getElementById(
            "campaign_creation_step_one_job_level_id"
          ).value = job["level"];
          next_counter += 1; // 3
        }
        if (job["education"] != null && job["education"] != "Invalid") {
          document.getElementById(
            "campaign_creation_step_one_education_level_id"
          ).value = job["education"];
          next_counter += 1; // 4
        }
        if (job["jobCategory"] != null && job["jobCategory"] != "Invalid") {
          document.getElementById(
            "campaign_creation_step_one_discipline_id"
          ).value = job["jobCategory"];
          next_counter += 1; // 5
        }
        if (job["industry"] != null && job["industry"] != "Invalid") {
          document.getElementById(
            "campaign_creation_step_one_industry_id"
          ).value = job["industry"];
        }
        const currDate = new Date();
        document.getElementById(
          "campaign_creation_step_one_campaign_start_date"
        ).value = `${currDate.getDate().toString().padStart(2, "0")}/${(
          currDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${currDate.getFullYear().toString()}`;
        document.getElementById(
          "campaign_creation_step_one_campaign_end_date"
        ).value = job["jobExpiry"];
        // should set contract type based on job type but now only setting permanent
        const selectElement = document.getElementById("permanent_position");
        if (selectElement != null) {
          selectElement.value = "permanent";
          selectElement.dispatchEvent(new Event("change"));
        }
        document.getElementById(
          "campaign_creation_step_one_recruiter_first_name"
        ).value = "";
        document.getElementById(
          "campaign_creation_step_one_recruiter_last_name"
        ).value = "";
        document.getElementById(
          "campaign_creation_step_one_recruiter_email"
        ).value = "";
        if (
          document.getElementById(
            "campaign_creation_step_one_forced_cover_letter"
          ).checked == true
        ) {
          document
            .getElementById("campaign_creation_step_one_forced_cover_letter")
            .click();
        }
  
        ext_app_button = document.getElementById(
          "campaign_creation_step_one_external_application"
        );
        if (ext_app_button != null) {
          ext_app_button.click();
          document.getElementById(
            "campaign_creation_step_one_external_type"
          ).value = job["applicationMethod"];
          if (job["applicationMethod"] == "email_application") {
            document.getElementById(
              "campaign_creation_step_one_external_email_address"
            ).value = job["applicationLink"];
            next_counter += 1; // 6
          } else if (job["applicationMethod"] == "outside") {
            document.getElementById(
              "campaign_creation_step_one_external_url"
            ).value = job["applicationLink"];
            next_counter += 1; // 6
          }
        } else {
          alert("Please check the campaign type.");
        }
  
        const newOption = document.getElementById(
          "campaign_creation_step_one_job_level_id"
        ).value;
        console.log("Level: ", newOption);
        const updated = await updateWithLevel(newOption, job["tab"]);
        console.log(updated);
        // move to next page if all fields are filled
        if (next_counter == 6) {
          document.querySelectorAll(".fz-btn:not(a)")[1].click();
        }
  
        if (job["approve"] == true) {
          if (
            document
              .getElementsByClassName("fz-heading-title mb-1")[3]
              .innerText.includes("External Application")
          ) {
            document.querySelectorAll(".fz-btn:not(a)")[1].click();
          } else {
            alert("Please check the campaign type.");
          }
        }
      } catch (error) {
        console.log(error);
      }
    };

  // Insert the Employer
  const insertEmployer = (employer, bool) => {
    console.log(employer, bool);
    const style = document.createElement("style");
    style.innerHTML = `
    #employerDiv {
      border: 2px solid black;
      margin: 6px 2px;
      padding: 6px;
    }`;
    document.head.appendChild(style);
    const employerDiv = document.createElement("div");
    employerDiv.id = "employerDiv";
    if (bool) {
      employerDiv.innerText = employer;
    } else {
      employerDiv.innerHTML = `<strong>${employer}</strong> not found.`;
    }
    const textDiv = document.getElementsByClassName("fz-info-text mb-3")[1];
    textDiv.after(employerDiv);
  };

  const addJobBox = (job) => {
    const jobDiv = document.getElementById("jobDiv");
    if (!jobDiv) {
      const style = document.createElement("style");
      style.innerHTML = `
      #jobDiv {
        border: 2px solid black;
        margin: 6px 2px;
        padding: 6px;
      }`;
      document.head.appendChild(style);
      const jobDiv = document.createElement("div");
      jobDiv.id = "jobDiv";
      jobDiv.innerHTML = `<strong>${job[0]}</strong> || ${job[1]}`;
      const textDiv = document.getElementById("skill_errors");
      textDiv.after(jobDiv);
      console.log(job[2]);
      if (job[2] == true) {
        document.getElementsByName("commit")[1].click();
      }
    }
  };
  // check the message type received from the background service worker
  if (type === "SCRAPE") {
    console.log(`tabId: ${data}`);
    scraperButtonFunction(data);
  }
  if (type === "FILLEMPLOYER") {
    if (data === undefined) {
      insertEmployer(employer, false);
      document
        .querySelectorAll("button")[1]
        .addEventListener("click", async function () {
          const employers = await chrome.storage.local.get("employers");
          let employersDict = employers.employers;
          employersDict[employer] =
            document.getElementById("employer_id").value;
          chrome.storage.local.set({ employers: employersDict });
        });
    } else {
      insertEmployer(employer, true);
      document.getElementById("employer_id").value = data;
      if (counter < 1) {
        document.querySelectorAll("button")[1].click();
      } else if (counter >= 1) {
        document
          .querySelectorAll("button")[1]
          .addEventListener("click", async function () {
            const employers = await chrome.storage.local.get("employers");
            let employersDict = employers.employers;
            employersDict[employer] =
              document.getElementById("employer_id").value;
            chrome.storage.local.set({ employers: employersDict });
          });
      }
    }
  }
  if (type === "FILLEC") {
    document
      .getElementById(
        "campaign_creation_step_type_application_type_application_type_external"
      )
      .click();
    document
      .getElementsByClassName("fz-navigation-bar__right")[1]
      .querySelector("input")
      .click();
    chrome.runtime.sendMessage({
      action: "DUPLICATE",
      data: data,
    });
  }

  if (type === "DUPLICATE") {
    document
      .getElementsByClassName("fz-btn fz-btn_blue fz-btn_wide fz-btn_md")[0]
      .click();
  }

  if (type === "ADDSEARCHBOX") {
    createSearchContainer(job, data);
  }

  if (type === "FILLJOBDETAILS") {
    fillJobDetails(job);
    document
      .getElementById("campaign_creation_step_one_job_level_id")
      .addEventListener("change", async function () {
        const newOption = document.getElementById(
          "campaign_creation_step_one_job_level_id"
        ).value;
        console.log("New Option: ", newOption);
        const updated = await updateWithLevel(newOption, job["tab"]);
        console.log(updated);
      });
  }
  if (type === "APPROVE") {
    if (
      document
        .getElementsByClassName("fz-navigation-bar__right")[0]
        .querySelector("a")
        .innerText.includes("Approve Campaign")
    ) {
      document
        .getElementsByClassName("fz-navigation-bar__right")[0]
        .querySelector("a")
        .click();
    }
  }
  if (type === "ADDJOBBOX") {
    addJobBox(job);
  }
  if (type === "PS_NEXT") {
    document
      .getElementsByClassName("styled__Next-sc-i4zqni-9 gBDxve")[0]
      .click();
  }
});
