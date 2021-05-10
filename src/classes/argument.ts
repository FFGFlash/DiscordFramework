export interface ArgumentOptions {
  optional?: boolean;
  description?: string;
}

export class Argument {
  name: string;
  options?: ArgumentOptions;

  constructor(name: string, options?: ArgumentOptions) {
    this.name = name;
    this.options = options;
  }

  get optional() {
    if (this.options && this.options.optional) {
      return this.options.optional;
    }
    return false;
  }

  get description() {
    if (this.options && this.options.description) {
      return this.options.description;
    }
    return "No Description Provided.";
  }

  get formated() {
    return this.optional ? `[${this.name}]` : `<${this.name}>`;
  }
}
