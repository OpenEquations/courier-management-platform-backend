export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export class PackageDetails {
  private constructor(
    private readonly weight: number,
    private readonly dimensions: Dimensions,
    private readonly description: string,
    private readonly isFragile: boolean,
  ) {}

  static create(
    weight: number,
    dimensions: Dimensions,
    description: string,
    isFragile: boolean,
  ): PackageDetails {
    if (weight <= 0) throw new Error('Weight must be positive');
    return new PackageDetails(weight, dimensions, description, isFragile);
  }

  getWeight(): number { return this.weight; }
  getDimensions(): Dimensions { return this.dimensions; }
  getDescription(): string { return this.description; }
  getIsFragile(): boolean { return this.isFragile; }
}
