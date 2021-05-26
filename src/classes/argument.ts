export interface ArgumentOptions {
  description?: string;
  optional?: boolean;
}

interface _ArgumentOptions extends ArgumentOptions {
  description: string;
  optional: boolean;
}

export class Argument {
  private _name: string;
  private _options: _ArgumentOptions;

  static readonly DefaultOptions: _ArgumentOptions = {
    description: "No Description Provided.",
    optional: false
  };

  constructor(name: string, options?: ArgumentOptions) {
    this._name = name;
    this._options = Object.assign({}, Argument.DefaultOptions, options);
  }

  get description() {
    return this._options.description;
  }

  get optional() {
    return this._options.optional;
  }

  get name() {
    return this._name;
  }

  get formated() {
    return this.optional ? `[${this.name}]` : `<${this.name}>`;
  }
}
