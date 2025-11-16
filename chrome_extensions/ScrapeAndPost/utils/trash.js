const scrapeButton = document.createElement("button");
scrapeButton.innerText = "Launch";
scrapeButton.classList.add("btn", "btn-primary");
scrapeButton.setAttribute("type", "button");
scrapeButton.setAttribute("data-toggle", "modal");
scrapeButton.setAttribute("target", "#modalId");

// create modal element
const modal = document.createElement("div");
modal.classList.add("modal", "fade");
modal.id = "modalId";
modal.tabIndex = "-1";
modal.setAttribute("aria-labelledby", "modalLabel");
modal.setAttribute("aria-hidden", "true");

// create modal dialog
const modalDialog = document.createElement("div");
modalDialog.classList.add("modal-dialog");

// create modal content
const modalContent = document.createElement("div");
modalContent.classList.add("modal-content");

// create modal header
const modalHeader = document.createElement("div");
modalHeader.classList.add("modal-header");

// create modal title
const modalTitle = document.createElement("div");
modalTitle.classList.add("modal-title");
modalTitle.id = "modalTitle";
modalTitle.textContent = "Modal Title";

// create modal close button
const closeButton = document.createElement("button");
closeButton.classList.add("btn-close");
closeButton.setAttribute("type", "button");
closeButton.setAttribute("data-bs-dismiss", "modal");
closeButton.setAttribute("aria-label", "Close");

// append title and close button to header
modalHeader.appendChild(modalTitle);
modalHeader.appendChild(closeButton);

// create modalBody
const modalBody = document.createElement("div");
modalBody.classList.add("modal-body");
modalBody.textContent = "Body content";

// create modalFooter
const modalFooter = document.createElement("div");
modalFooter.classList.add("modal-footer");

// create modalFooter Buttons
const modalFooterCloseButton = document.createElement("button");
modalFooterCloseButton.classList.add("btn", "btn-secondary");
modalFooterCloseButton.setAttribute("data-bs-dismiss", "modal");
modalFooterCloseButton.setAttribute("type", "button");

modalFooterCloseButton.innerText = "Close";
const modalFooterSaveButton = document.createElement("button");
modalFooterSaveButton.classList.add("btn", "btn-primary");
modalFooterSaveButton.setAttribute("data-bs-dismiss", "modal");
modalFooterCloseButton.setAttribute("type", "button");
modalFooterSaveButton.innerText = "Save";

// append modal footer buttons to footer
modalFooter.appendChild(modalFooterCloseButton);
modalFooter.appendChild(modalFooterSaveButton);

// append modal body to the content
modalContent.appendChild(modalBody);
modalContent.appendChild(modalFooter);

// append modal content to modal dialog
modalDialog.appendChild(modalContent);

// append modal dialog to the modal
modal.appendChild(modalDialog);

//append modal to the body
document.body.appendChild(modal);

const addBootstrapCDN = () => {
  document.addEventListener("DOMContentLoaded", function () {
    // Create link elements
    const bootstrapCSS = document.createElement("link");
    bootstrapCSS.rel = "stylesheet";
    bootstrapCSS.crossorigin = "anonymous";
    bootstrapCSS.href =
      "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css";
    bootstrapCSS.integrity =
      "sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65";

    const bootstrapJS = document.createElement("script");
    bootstrapJS.src =
      "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js";
    bootstrapJS.integrity =
      "sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+jjXkk+Q2h455rYXK/7HAuoJl+0I4";
    bootstrapJS.crossOrigin = "anonymous";

    // Append link elements to the head
    document.head.appendChild(bootstrapCSS);
    document.head.appendChild(popperJS);
  });
};
