import { Notebook } from "./runtime/Notebook";

await import("./runtime/Notebook");

export const notebook = new Notebook();

const { cell } = notebook;

const hello = cell("hello", () => "hello world! How are you?");

cell(
  "fantastic",
  () => `I heard someone say "${hello()}" I fell fantastic, and you?`
);
