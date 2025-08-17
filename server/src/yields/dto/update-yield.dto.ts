import { PartialType } from '@nestjs/mapped-types';
import { CreateYieldDto } from './create-yield.dto';

export class UpdateYieldDto extends PartialType(CreateYieldDto) {}
