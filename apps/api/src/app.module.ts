import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './modules/students/students.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WeightModule } from './modules/weight/weight.module';
import { PlansModule } from './modules/plans/plans.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { DietModule } from './modules/diet/diet.module';
import { BodyRecordModule } from './modules/body-record/body-record.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DietModule,
    BodyRecordModule,
    StudentsModule,
    PaymentsModule,
    WeightModule,
    PlansModule,
    DashboardModule,
    NotificationsModule,
  ],
})
export class AppModule {}
