import { IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';

/** Request body for PATCH /schools/:id (super_admin only). All fields optional. */
export class UpdateSchoolDto {
  /** New lifecycle status */
  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: 'active' | 'suspended';

  /** New seat (license) limit */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  seatLimit?: number;
}
