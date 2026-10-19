import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects/projects.controller";
import { MessagesController } from "./messages/messages.controller";
import { MessagesService } from "./messages/messages.service";
import { TasksController } from "./tasks/tasks.controller";
import { SubcontractorsController } from "./subcontractors/subcontractors.controller";
import { RealtimeGateway } from "./realtime/realtime.gateway";
import { TranslationQueue } from "./queue/translation.queue";
import { PrismaService } from "./prisma.service";

@Module({
  controllers: [ProjectsController, MessagesController, TasksController, SubcontractorsController],
  providers: [PrismaService, MessagesService, RealtimeGateway, TranslationQueue],
})
export class AppModule {}
