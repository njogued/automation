function gpt(prompt, context) {
  const apiKey = "{{ YOUR API KEY}}";
  const aiModel = "gpt-4o";
  const system = "You are a precise and helpful assistant.";
  const userPrompt = `Prompt: ${prompt}\n\nInputs: ${JSON.stringify(context)}`;
  const url = "https://api.openai.com/v1/chat/completions";
  const payload = {
    model: aiModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(userPrompt) }
    ],
    temperature: 0.2,
  };
  const resp = UrlFetchApp.fetch(url, {
    method: "post",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const txt = resp.getContentText();
  const data = JSON.parse(txt);
  const content = data.choices &&
    data.choices[0] && data.choices[0].message && 
    data.choices[0].message.content;
  if (!content) throw new Error("No content returned from model");
  return content;
}
