import { notebook } from "../notebook";

export class Notebook {
  private readonly cells: Cell[] = [];
  constructor() {
    this.cell = this.cell.bind(this);
  }

  cell<Value>(
    name: string,
    definition: Definition<Value>,
    options: CellOptions = {}
  ): Recall<Value> {
    const cell = new Cell(name, definition, options);
    this.cells.push(cell);
    return cell.recall;
  }
  tick(previous: Context): Context {
    console.debug("Notebook.click start");
    const context = new Context(notebook);
    for (const cell of this.cells) {
      cell.eval(context);
    }
    for (const cell of this.cells) {
      cell.end();
    }
    console.debug("Notebook.click end");
    return context;
  }
}

export class Context {
  constructor(private readonly notebook?: Notebook) {}
  readonly values = new Map<Cell, unknown>();
  activeSubscriber?: Cell;
  subscribers = new Map<Cell, Set<Cell>>();
  startScope(cell: Cell) {
    const previousSubscriber = this.activeSubscriber;
    this.activeSubscriber = cell;
    return previousSubscriber;
  }
  endScope(cell: Cell | undefined) {
    this.activeSubscriber = cell;
  }
}

interface CellOptions {
  hidden?: boolean;
}

type Definition<Value> = () => Value;

type Recall<Value> = (() => Value) & { ready(): Promise<Value> };

class Cell<Value = unknown> {
  readonly recall: Recall<Value>;
  private context?: Context;
  constructor(
    readonly name: string,
    private readonly definition: Definition<Value>,
    readonly options: CellOptions
  ) {
    this.recall = Object.assign(
      () => {
        if (this.context?.activeSubscriber) {
          this.context?.subscribers
            .get(this)
            ?.add(this.context.activeSubscriber);
        }
        return this.context?.values.get(this) as Value;
      },
      {
        ready: async () => definition(),
      }
    );
  }
  eval(context: Context) {
    this.context = context;
    const scope = context.startScope(this);
    const value = this.definition();
    context.endScope(scope);
    context.values.set(this, value);
    context.subscribers.set(this, new Set());
  }
  end() {
    this.context = undefined;
  }
}
