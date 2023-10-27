const GeneratorFunction = function* () {}.constructor;

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
    console.debug("Notebook.cell created cell", cell);
    this.cells.push(cell);
    return cell.recall;
  }
  tick(previous?: Context): Context {
    console.debug("Notebook.tick start - previous:", previous);
    const context = new Context(this);
    for (const cell of this.cells) {
      const previousState = previous?.states.get(cell);
      cell.eval(context, previousState);
    }
    for (const cell of this.cells) {
      cell.end();
    }
    console.debug("Notebook.tick end - context:", context);
    return context;
  }
}

class State<Value = unknown> {
  done?: boolean;
  value?: Value;
  iterator?: Iterator<Value>;
  subscribers = new Set<Cell>();
  dependencies = new Set<Cell>();
  static readonly empty = new State<never>();
  constructor(previous?: Partial<State<Value>>) {
    if (previous) {
      Object.assign(this, previous);
    }
  }
}

export class Context {
  constructor(private readonly notebook?: Notebook) {}
  readonly states = new Map<Cell, State>();
  activeSubscriber?: Cell;
  startScope(cell: Cell) {
    const previousSubscriber = this.activeSubscriber;
    this.activeSubscriber = cell;
    return previousSubscriber;
  }
  endScope(cell: Cell | undefined) {
    this.activeSubscriber = cell;
  }
  addDependency(cell: Cell) {
    const activeSubscriber = this.activeSubscriber;
    if (activeSubscriber) {
      this.states.get(cell)?.subscribers.add(activeSubscriber);
      this.states.get(activeSubscriber)?.dependencies.add(cell);
    }
  }
}

interface CellOptions {
  hidden?: boolean;
}

type Definition<Value> = (() => Value) | (() => Iterator<Value>);

type Recall<Value> = (() => Value) & {
  // ready(): Promise<Value>
};

class Cell<Value = unknown> {
  readonly recall: Recall<Value>;
  private context?: Context;
  constructor(
    readonly name: string,
    private readonly definition: Definition<Value>,
    readonly options: CellOptions
  ) {
    this.recall = Object.assign(
      (): Value => {
        this.context?.addDependency(this);
        return this.context?.states.get(this)?.value as Value;
      },
      {
        // ready: async () => this.recall(),
      }
    );
  }
  eval(context: Context, previous: State<Value> = State.empty) {
    this.context = context;
    if (previous.done) {
      console.debug("Cell.eval done - cell:", this, "previous:", previous);
      context.states.set(this, previous);
    } else if (this.definition instanceof GeneratorFunction) {
      console.debug("Cell.eval generator - cell:", this, "previous:", previous);
      const state = new State(previous);
      state.iterator ||= this.definition() as Iterator<Value>;
      context.states.set(this, state);
      const scope = context.startScope(this);
      const result = state.iterator.next();
      context.endScope(scope);
      const done = result.done;
      state.value = done ? previous.value : result.value;
      state.done = done;
    } else {
      console.debug(
        "Cell.eval single value - cell:",
        this,
        "previous:",
        previous
      );
      const state = new State();
      context.states.set(this, state);
      const scope = context.startScope(this);
      state.value = this.definition();
      context.endScope(scope);
      state.done = true;
    }
  }
  end() {
    this.context = undefined;
  }
}
