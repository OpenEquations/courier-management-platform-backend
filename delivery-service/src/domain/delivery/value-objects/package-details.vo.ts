export class PackageDetails {
  private constructor(
    private readonly description: string,
    private readonly weightKg: number,
    private readonly lengthCm: number | null,
    private readonly widthCm: number | null,
    private readonly heightCm: number | null,
    private readonly isFragile: boolean,
  ) {}

  static create(props: {
    description: string;
    weightKg: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    isFragile?: boolean;
  }): PackageDetails {
    if (!props.description?.trim()) throw new Error('Package description is required');
    if (props.weightKg <= 0) throw new Error('Weight must be positive');
    return new PackageDetails(
      props.description,
      props.weightKg,
      props.lengthCm ?? null,
      props.widthCm ?? null,
      props.heightCm ?? null,
      props.isFragile ?? false,
    );
  }

  getDescription(): string { return this.description; }
  getWeightKg(): number { return this.weightKg; }
  getLengthCm(): number | null { return this.lengthCm; }
  getWidthCm(): number | null { return this.widthCm; }
  getHeightCm(): number | null { return this.heightCm; }
  isPackageFragile(): boolean { return this.isFragile; }
}
