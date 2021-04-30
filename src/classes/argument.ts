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
}
