import { Module } from '@nestjs/common';
import { AcademyProgressService } from './academy-progress.service';
import { AcademyProgressController } from './academy-progress.controller';

@Module({
  controllers: [AcademyProgressController],
  providers: [AcademyProgressService],
  exports: [AcademyProgressService],
})
export class AcademyProgressModule {}
