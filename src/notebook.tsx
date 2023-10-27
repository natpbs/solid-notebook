import { Notebook } from "./runtime/Notebook";

export const notebook = new Notebook();

const { cell } = notebook;

const hello = cell("hello", () => "hello world! How are you?");

cell(
  "fantastic",
  () => `I heard someone say '${hello()}' I fell fantastic, and you?`
);

cell<string>("generator", function* () {
  let i = 0;
  while (true) {
    yield `yielding ${i} from a generator`;
    i++;
  }
});
