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
          <option value="862">Lagos, Nigeria</option>
          <option value="733">Abuja, Nigeria</option>
          <option value="801">Portharcourt, Nigeria</option>
          <option value="834">Maiduguri, Nigeria</option>
          <option value="771">Ibadan, Nigeria</option>
          <option value="532">Nigeria</option>
          <option value="730">Aba, Nigeria</option>
          <option value="731">Abakaliki, Nigeria</option>
          <option value="732">Abeokuta, Nigeria</option>
          <option value="734">Ado-Ekiti, Nigeria</option>
          <option value="735">Agaie, Nigeria</option>
          <option value="736">Akure, Nigeria</option>
          <option value="737">Argungu, Nigeria</option>
          <option value="738">Arochukwu, Nigeria</option>
          <option value="739">Asaba, Nigeria</option>
          <option value="740">Awka, Nigeria</option>
          <option value="741">Azare, Nigeria</option>
          <option value="742">Badagry, Nigeria</option>
          <option value="743">Baro, Nigeria</option>
          <option value="744">Bauchi, Nigeria</option>
          <option value="745">Benin City, Nigeria</option>
          <option value="746">Bida, Nigeria</option>
          <option value="747">Birnin Kebbi, Nigeria</option>
          <option value="748">Birnin Kudu, Nigeria</option>
          <option value="749">Biu, Nigeria</option>
          <option value="750">Bonny, Nigeria</option>
          <option value="751">Brass, Nigeria</option>
          <option value="752">Bukuru, Nigeria</option>
          <option value="753">Burutu, Nigeria</option>
          <option value="754">Calabar, Nigeria</option>
          <option value="755">Damaturu, Nigeria</option>
          <option value="756">Daura, Nigeria</option>
          <option value="757">Deba Habe, Nigeria</option>
          <option value="758">Degema, Nigeria</option>
          <option value="759">Dikwa, Nigeria</option>
          <option value="760">Dutse, Nigeria</option>
          <option value="761">Ede, Nigeria</option>
          <option value="762">Effon-Alaiye, Nigeria</option>
          <option value="763">Enugu, Nigeria</option>
          <option value="764">Epe, Nigeria</option>
          <option value="765">Gombe, Nigeria</option>
          <option value="766">Gumel, Nigeria</option>
          <option value="768">Gusau, Nigeria</option>
          <option value="769">Gwandu, Nigeria</option>
          <option value="770">Hadejia, Nigeria</option>
          <option value="767">Ibi, Nigeria</option>
          <option value="772">Idah, Nigeria</option>
          <option value="773">Ijebu-Ode, Nigeria</option>
          <option value="774">Ikare, Nigeria</option>
          <option value="775">Ikere-Ekiti, Nigeria</option>
          <option value="776">Ikire, Nigeria</option>
          <option value="777">Ikirun, Nigeria</option>
          <option value="778">Ikorodu, Nigeria</option>
          <option value="779">Ikot Abasi, Nigeria</option>
          <option value="780">Ikot Ekpene, Nigeria</option>
          <option value="781">Ila, Nigeria</option>
          <option value="782">Ilaro, Nigeria</option>
          <option value="783">Ile-Ife, Nigeria</option>
          <option value="784">Ilesha, Nigeria</option>
          <option value="785">Ilobu, Nigeria</option>
          <option value="786">Ilorin, Nigeria</option>
          <option value="787">Inisa, Nigeria</option>
          <option value="788">Iseyin, Nigeria</option>
          <option value="789">Iwo, Nigeria</option>
          <option value="790">Jalingo, Nigeria</option>
          <option value="791">Jamaare, Nigeria</option>
          <option value="792">Jebba, Nigeria</option>
          <option value="793">Jemaa, Nigeria</option>
          <option value="794">Jimeta, Nigeria</option>
          <option value="795">Jos, Nigeria</option>
          <option value="841">Kabba, Nigeria</option>
          <option value="842">Kaduna, Nigeria</option>
          <option value="843">Kano, Nigeria</option>
          <option value="844">Katagum, Nigeria</option>
          <option value="845">Katsina, Nigeria</option>
          <option value="846">Kaura Namoda, Nigeria</option>
          <option value="847">Kazaure, Nigeria</option>
          <option value="848">Keffi, Nigeria</option>
          <option value="849">Koko, Nigeria</option>
          <option value="850">Kontagora, Nigeria</option>
          <option value="851">Kumo, Nigeria</option>
          <option value="796">Lafia, Nigeria</option>
          <option value="797">Lafiagi, Nigeria</option>
          <option value="798">Lapai, Nigeria</option>
          <option value="799">Lokoja, Nigeria</option>
          <option value="835">Makurdi, Nigeria</option>
          <option value="836">Minna, Nigeria</option>
          <option value="837">Misau, Nigeria</option>
          <option value="838">Mubi, Nigeria</option>
          <option value="839">Muri, Nigeria</option>
          <option value="840">Mushin, Nigeria</option>
          <option value="833">Nasarawa, Nigeria</option>
          <option value="832">Nguru, Nigeria</option>
          <option value="831">Nsukka, Nigeria</option>
          <option value="830">Numan, Nigeria</option>
          <option value="829">Offa, Nigeria</option>
          <option value="828">Ogbomosho, Nigeria</option>
          <option value="827">Ogoja, Nigeria</option>
          <option value="826">Oka-Akoko, Nigeria</option>
          <option value="825">Okene, Nigeria</option>
          <option value="824">Okrika, Nigeria</option>
          <option value="823">Ondo, Nigeria</option>
          <option value="822">Onitsha, Nigeria</option>
          <option value="821">Oron, Nigeria</option>
          <option value="820">Oshogbo, Nigeria</option>
          <option value="819">Owerri, Nigeria</option>
          <option value="818">Owo, Nigeria</option>
          <option value="817">Oyo, Nigeria</option>
          <option value="800">Pategi, Nigeria</option>
          <option value="814">Saki, Nigeria</option>
          <option value="815">Sapele, Nigeria</option>
          <option value="816">Shagamu, Nigeria</option>
          <option value="813">Shomolu, Nigeria</option>
          <option value="812">Sokoto, Nigeria</option>
          <option value="811">Suleja, Nigeria</option>
          <option value="802">Ughelli, Nigeria</option>
          <option value="803">Umuahia, Nigeria</option>
          <option value="804">Uyo, Nigeria</option>
          <option value="805">Vom, Nigeria</option>
          <option value="806">Warri, Nigeria</option>
          <option value="807">Wase, Nigeria</option>
          <option value="808">Yelwa, Nigeria</option>
          <option value="809">Yola, Nigeria</option>
          <option value="810">Zaria, Nigeria</option>
          <option value="532">Nigeria</option>
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
          <option value="Invalid">---------------</option>
          <option value="Accounting, finance, banking, insurance">
            Accounting, finance, banking, insurance
          </option>
          <option value="Administrative, clerical">
            Administrative, clerical
          </option>
          <option value="Agriculture, fishing, forestry, wildlife">
            Agriculture, fishing, forestry, wildlife
          </option>
          <option value="Business, strategic management">
            Business, strategic management
          </option>
          <option value="Construction">Construction</option>
          <option value="Customer support, client care">
            Customer support, client care
          </option>
          <option value="Design, arts">Design, arts</option>
          <option value="Electrical engineering">Electrical engineering</option>
          <option value="Energy, power">Energy, power</option>
          <option value="Engineering, architecture">
            Engineering, architecture
          </option>
          <option value="Entertainment">Entertainment</option>
          <option value="Food, nutrition">Food, nutrition</option>
          <option value="General management, leadership">
            General management, leadership
          </option>
          <option value="Government, community development, public services">
            Government, community development, public services
          </option>
          <option value="Human resources">Human resources</option>
          <option value="Information technology, software development, data">
            Information technology, software development, data
          </option>
          <option value="Installation, maintenance, repair">
            Installation, maintenance, repair
          </option>
          <option value="Legal">Legal</option>
          <option value="Manufacturing, operations, quality">
            Manufacturing, operations, quality
          </option>
          <option value="Mechanical engineering">Mechanical engineering</option>
          <option value="Media, communications, languages">
            Media, communications, languages
          </option>
          <option value="Medical, health">Medical, health</option>
          <option value="Project, program management">
            Project, program management
          </option>
          <option value="Research, academy">Research, academy</option>
          <option value="Restaurant, hospitality, travel">
            Restaurant, hospitality, travel
          </option>
          <option value="Sales, marketing, promotion">
            Sales, marketing, promotion
          </option>
          <option value="Security">Security</option>
          <option value="Skilled, manual labor">Skilled, manual labor</option>
          <option value="Sports, beauty, wellbeing">
            Sports, beauty, wellbeing
          </option>
          <option value="Teaching, training">Teaching, training</option>
          <option value="Telecommunications">Telecommunications</option>
          <option value="Transportation, logistics, driving">
            Transportation, logistics, driving
          </option>
        </select>
      </div>
      <div class="gridCol">
        <label>Industry</label
        ><select name="industry" id="industry">
          <option value="Invalid">---------------</option>
          <option value="Aeronautics">Aeronautics</option>
          <option value="Agriculture, fishing, forestry">
            Agriculture, fishing, forestry
          </option>
          <option value="Arts, design">Arts, design</option>
          <option value="Automotive">Automotive</option>
          <option value="Banking, microfinance, insurance">
            Banking, microfinance, insurance
          </option>
          <option value="Beauty, cosmetics">Beauty, cosmetics</option>
          <option value="Communications, media, radio, tv">
            Communications, media, radio, tv
          </option>
          <option value="Computers, software development and services">
            Computers, software development and services
          </option>
          <option value="Construction, renovation, maintenance">
            Construction, renovation, maintenance
          </option>
          <option value="Consulting, business support, auditing">
            Consulting, business support, auditing
          </option>
          <option value="Data/Research">Data/Research</option>
          <option value="Education, academic">Education, academic</option>
          <option value="Electronics">Electronics</option>
          <option value="Energy, utilities, environment">
            Energy, utilities, environment
          </option>
          <option value="Engineering, architecture">
            Engineering, architecture
          </option>
          <option value="Entertainment, events">Entertainment, events</option>
          <option value="Finance &amp; FinTech">Finance &amp; FinTech</option>
          <option value="Financial Services">Financial Services</option>
          <option value="Fitness, well-being and lifestyle">
            Fitness, well-being and lifestyle
          </option>
          <option value="Governmental">Governmental</option>
          <option value="Handicraft">Handicraft</option>
          <option value="Health care, medical">Health care, medical</option>
          <option value="Housekeeping, maintenance">
            Housekeeping, maintenance
          </option>
          <option value="Human resources, talent development, recruiting">
            Human resources, talent development, recruiting
          </option>
          <option value="Import, export">Import, export</option>
          <option value="Legal, accounting">Legal, accounting</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Marketing, advertising">Marketing, advertising</option>
          <option value="Non-profit, social work">Non-profit, social work</option>
          <option value="Outsourcing, leasing">Outsourcing, leasing</option>
          <option value="Raw materials, oil, chemicals">
            Raw materials, oil, chemicals
          </option>
          <option value="Real estate">Real estate</option>
          <option value="Restaurant, hospitality, travel">
            Restaurant, hospitality, travel
          </option>
          <option value="Retail, wholesale, FMCG">Retail, wholesale, FMCG</option>
          <option value="Security">Security</option>
          <option value="Telecommunications">Telecommunications</option>
          <option value="Textile, fashion">Textile, fashion</option>
          <option value="Transportation, logistics, storage">
            Transportation, logistics, storage
          </option>
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
          <option value="Invalid">---------------</option>
          <option value="Bachelor's degree">Bachelor's degree</option>
          <option value="Primary school">Primary school</option>
          <option value="High, secondary school">High, secondary school</option>
          <option value="Vocational school">Vocational school</option>
          <option value="Diploma, Associate's degree">
            Diploma, Associate's degree
          </option>
          <option value="Post-graduate education">Post-graduate education</option>
        </select>
      </div>
      <div class="gridCol">
        <label>Years of Experience</label
        ><select name="experience" id="experience">
          <option value="Invalid">---------------</option>
          <option value="None">None</option>
          <option value="One Month">One Month</option>
          <option value="Three Months">Three Months</option>
          <option value="6 Months">6 Months</option>
          <option value="12 Months">12 Months</option>
          <option value="18 Months">18 Months</option>
          <option value="2 Years">2 Years</option>
          <option value="3 Years">3 Years</option>
          <option value="5 Years">5 Years</option>
          <option value="7 Years">7 Years</option>
          <option value="10 Years">10 Years</option>
        </select>
      </div>
    </div>
    <div class="gridDiv">
      <div class="gridCol">
        <label>Job Expiry</label
        ><input type="date" name="jobExpiry" id="jobExpiry" />
      </div>
      <div class="gridCol">
        <label>Job Level</label
        ><select name="jobLevel" id="jobLevel">
          <option value="Invalid">---------------</option>
          <option value="Experienced (senior worker)">
            Experienced (senior worker)
          </option>
          <option value="Intern or trainee">Intern or trainee</option>
          <option value="Basic level (worker)">Basic level (worker)</option>
          <option value="Expert (non-managerial)">Expert (non-managerial)</option>
          <option value="Manager (team leader)">Manager (team leader)</option>
          <option value="Senior manager (department head)">
            Senior manager (department head)
          </option>
          <option value="Executive (director)">Executive (director)</option>
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
    // Get all divs in the main body text
    const divsInMain = document
      .getElementsByClassName("mycase4")[0]
      .querySelectorAll("div");

    // Get company name
    const employer = document
      .getElementsByClassName("jobheader")[0]
      .querySelector("h1 a")
      .innerText.split(" at ")[1]
      .trim();
    document.getElementById("employer").value = employer;

    // Get job
    // const job = divsInMain[3]
    //   .querySelectorAll("strong")[0]
    //   .innerText.split(":")[1]
    //   .trim();
    const job = document
      .getElementsByClassName("jobheader")[0]
      .querySelector("h1 a")
      .innerText.split(" at ")[0];
    document.getElementById("jobTitle").value = job;

    // Get application method and value
    const app_link = divsInMain[divsInMain.length - 20]
      .querySelector("a")
      .getAttribute("href");
    if (app_link.includes("http")) {
      document.getElementById("applicationMethod").value = "outside";
      document.getElementById("applicationLink").value = app_link;
    } else if (app_link.includes("@")) {
      document.getElementById("applicationMethod").value = "email_application";
      document.getElementById("applicationLink").value = app_link.split(":")[1];
    }

    // Get application closing date
    const expiry = divsInMain[divsInMain.length - 21].innerText.split("\n")[1];
    if (expiry.includes("2023") || expiry.includes("2024")) {
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
      let mailText = "";
      const divHeaders = divsInMain[4].querySelectorAll("strong");
      const qualificationHeader = divHeaders[divHeaders.length - 1];
      const responsibilities = divsInMain[4].innerHTML
        .split(qualificationHeader.innerHTML)[0]
        .replace(
          /<strong>(.*?)Responsibilities(.*?)<\/strong>/gi,
          "<strong>$1Duties$2</strong>"
        );
      const jobSummary = divsInMain[4].innerHTML.split(
        qualificationHeader.innerHTML
      )[1];
      const matches = jobSummary.match(/\b\d+\b/g);
      const yearsList = matches
        ? matches.map((match) => parseInt(match, 10))
        : [];
      if (yearsList.length > 0) {
        const minYear = Math.min(...yearsList);
        console.log(`minYear: ${minYear}`);
      }
      if (app_link.includes("@")) {
        mailText = divsInMain[divsInMain.length - 20].innerHTML.replace(
          /<a\s+[^>]*?href\s*=\s*['"]mailto:(.*?)['"][^>]*?>(.*?)<\/a>/i,
          "the provided email address"
        );
      }
      document.getElementById(
        "jobSummary"
      ).innerHTML = `<strong>${qualificationHeader.innerHTML}</strong>${jobSummary}${mailText}`;
      document.getElementById("responsibilities").innerHTML = responsibilities;
    } catch (error) {
      console.log(error);
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
        const jobDetails = {
          approve: false,
          tab: data,
          employer: document.getElementById("employer").value,
          employerId: employerId,
          location: document.getElementById("location").value,
          jobTitle: document.getElementById("jobTitle").value,
          counter: 0,
          contractType: document.getElementById("jobType").value,
          jobSummary: document.getElementById("jobSummary").innerHTML,
          experience: document.getElementById("experience").value,
          level: document.getElementById("jobLevel").value,
          education: document.getElementById("education").value,
          jobCategory: document.getElementById("jobCategory").value,
          industry: document.getElementById("industry").value,
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

      const divsInMain = document
        .getElementsByClassName("mycase4")[0]
        .querySelectorAll("div");
      const lastDiv = divsInMain[divsInMain.length - 1];
      lastDiv.after(scrapeButton);
    }
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
    console.log(data);
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
