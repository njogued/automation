function onFormSubmit(e) {
  const nv = e.namedValues;
  let formResponse = e.response;
  let itemResponses = formResponse.getItemResponses();
  let fname, emailAddress;
  for (var i = 0; i < itemResponses.length; i++) {
    var title = itemResponses[i].getItem().getTitle();
    var response = itemResponses[i].getResponse();
    switch (title) {
      case "Name":
        fname = response.split(" ")[0];
        break;
      case "Email address":
        emailAddress = response;
        break;
    }
  }
  const subject = "You’re confirmed";
  const htmlBody = `<p style="margin:0 0 16px;">Hi ${fname},</p>
  <p style="margin:0 0 16px;">Thank you for registering for the session!</p>
    //   more content goes here...
  <p style="margin:0 0 16px;">Best regards,<br/>Your Name</p>`;
  GmailApp.sendEmail(
    emailAddress,
    subject,
    "// This is a fallback plain text body (Optional)",
    { htmlBody, name: "Your Name" }
  );
}
