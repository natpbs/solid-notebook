import { For, createEffect, createSignal } from "solid-js";
import { Context, Notebook } from "./Notebook";

export const Render = (props: { notebook: Notebook }) => {
  const [context, setContext] = createSignal(new Context());
  const [play, setPlay] = createSignal(true);
  createEffect(
    (timeout) => {
      if (typeof timeout === "number") {
        console.debug("Renderer.tick - timeout:", timeout, "play:", play());
        clearTimeout(timeout);
      }
      if (play()) {
        context();
        return setTimeout(
          () => setContext((context) => props.notebook.tick(context)),
          1000
        );
      }
    },
    undefined,
    { name: "tick" }
  );
  return (
    <>
      <button onClick={() => setPlay((play) => !play)}>
        {play() ? "Running, click to pause" : "Paused, click to run"}
      </button>
      <For each={Array.from(context().states.values())}>
        {(state) => <div class="value">{JSON.stringify(state.value)}</div>}
      </For>
    </>
  );
};
