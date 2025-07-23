import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
});

const completion = openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  store: true,
  messages: [
    {"role": "user", "content": "write a haiku about ai"},
  ],
});

completion.then((result) => console.log(result.choices[0].message));