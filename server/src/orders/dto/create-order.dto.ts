import { IsNumber, IsPositive, IsInt, IsDateString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateOrderDto {
  @IsInt({ message: 'Term must be an integer' })
  @Min(1, { message: 'Term must be at least 1 week' })
  @Max(52, { message: 'Term cannot exceed 52 weeks' })
  term: number;

  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be positive' })
  @Min(100, { message: 'Minimum order amount is $100' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsDateString({}, { message: 'Date must be in valid ISO format (YYYY-MM-DD)' })
  date: string;
}