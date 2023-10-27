import { For, createEffect, createSignal } from "solid-js";
import { Context, Notebook } from "./Notebook";

export const Render = (props: { notebook: Notebook }) => {
  const [context, setContext] = createSignal(new Context());
  createEffect(() => {
    (window as unknown as Record<string, unknown>).context = context();
    setTimeout(
      () => setContext((context) => props.notebook.tick(context)),
      10000
    );
  });
  return (
    <For each={Array.from(context().values.values())}>
      {(value) => <div class="value">{JSON.stringify(value)}</div>}
    </For>
  );
};
